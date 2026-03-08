import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { handleDbWriteFailure } from "@/lib/db-resilience"
import { AppData, defaultData } from "@/lib/store"
import { pack, unpack } from "msgpackr"

export async function GET(req: NextRequest) {
    try {
        const secret = process.env.NEXTAUTH_SECRET
        if (!secret) return NextResponse.json({ error: "Configuration error" }, { status: 503 })

        const token = await getToken({ req, secret })
        const userId = typeof token?.id === "string" ? token.id : null

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const sinceStr = searchParams.get("since")
        const sinceDate = sinceStr ? new Date(sinceStr) : null
        const filter = sinceDate ? { updatedAt: { gt: sinceDate } } : {}

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                jobs: { where: filter },
                shifts: { where: filter },
                expenses: { where: filter },
                goals: { where: filter },
                budgetCategories: { where: filter },
                attendanceEvents: { where: filter },
            }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const u = user as any

        const appData: AppData = {
            jobs: (u.jobs || []).map((j: any) => ({
                id: j.id,
                name: j.name,
                category: "custom",
                baseRate: j.baseRate,
                rates: {
                    weekday: j.weekdayRate,
                    saturday: j.saturdayRate,
                    sunday: j.sundayRate,
                    public_holiday: j.publicHolidayRate,
                    overtime: j.overtimeRate
                },
                color: "#0d9488",
                updatedAt: j.updatedAt.toISOString(),
            })),
            shifts: (u.shifts || []).map((s: any) => ({
                id: s.id,
                date: s.date.toISOString().split('T')[0],
                startTime: s.startTime,
                endTime: s.endTime,
                jobId: s.jobId,
                rateType: s.rateType as any,
                breakMinutes: 0,
                hours: s.hours,
                earnings: s.earnings,
                note: s.note || undefined,
                updatedAt: s.updatedAt.toISOString(),
            })),
            expenses: (u.expenses || []).map((e: any) => ({
                id: e.id,
                category: e.category,
                amount: e.amount,
                description: e.description,
                date: e.date.toISOString().split('T')[0],
                updatedAt: e.updatedAt.toISOString(),
            })),
            goals: (u.goals || []).map((g: any) => ({
                id: g.id,
                name: g.name,
                icon: "piggy-bank",
                targetAmount: g.targetAmount,
                currentAmount: g.currentAmount,
                deadline: g.deadline.toISOString().split('T')[0],
                updatedAt: g.updatedAt.toISOString(),
            })),
            budgetCategories: (u.budgetCategories || []).map((b: any) => ({
                id: b.id,
                name: b.name,
                budgeted: b.budgeted,
                color: b.color,
                updatedAt: b.updatedAt.toISOString(),
            })),
            attendanceEvents: (u.attendanceEvents || []).map((a: any) => ({
                id: a.id,
                date: a.date.toISOString().split('T')[0],
                jobId: a.jobId,
                type: a.type as any,
                minutesLate: a.minutesLate || undefined,
                note: a.note || undefined,
                updatedAt: a.updatedAt.toISOString(),
            })),
            settings: u.settings || defaultData.settings,
            publicHolidays: u.publicHolidays ?? defaultData.publicHolidays,
        }

        const accept = req.headers.get("accept") || ""
        const responseHeaders = new Headers({
            "Cache-Control": "public, s-maxage=1, stale-while-revalidate=59" // Edge caching
        })

        if (accept.includes("application/msgpack")) {
            responseHeaders.set("Content-Type", "application/msgpack")
            return new Response(pack({ data: appData }) as any, {
                headers: responseHeaders
            })
        }

        responseHeaders.set("Content-Type", "application/json")
        return new Response(JSON.stringify({ data: appData }), {
            headers: responseHeaders
        })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch sync data" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const secret = process.env.NEXTAUTH_SECRET
        if (!secret) return NextResponse.json({ error: "Configuration error" }, { status: 503 })

        const token = await getToken({ req, secret })
        const userId = typeof token?.id === "string" ? token.id : null

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const contentType = req.headers.get("content-type") || ""
        let data: AppData
        if (contentType.includes("application/msgpack")) {
            const buffer = await req.arrayBuffer()
            const payload = unpack(new Uint8Array(buffer))
            data = payload.data
        } else {
            const body = await req.json()
            data = body.data
        }

        if (!data) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 })
        }

        // Use a transaction to safely sync user data
        await prisma.$transaction(async (txArg) => {
            const tx = txArg as any
            const userExists = await tx.user.findUnique({ where: { id: userId }, select: { id: true } })
            if (!userExists) {
                // In dev environments without a seeded user, skip sync gracefully.
                return
            }
            // 1. Update User settings
            await tx.user.update({
                where: { id: userId },
                data: {
                    settings: data.settings as any,
                    publicHolidays: data.publicHolidays,
                }
            })

            // 2. Smart Upsert for Jobs
            if (data.jobs?.length) {
                for (const j of data.jobs) {
                    await tx.job.upsert({
                        where: { id: j.id },
                        create: {
                            id: j.id,
                            userId,
                            name: j.name,
                            employer: j.name,
                            baseRate: j.baseRate,
                            weekdayRate: j.rates.weekday,
                            saturdayRate: j.rates.saturday,
                            sundayRate: j.rates.sunday,
                            publicHolidayRate: j.rates.public_holiday,
                            overtimeRate: j.rates.overtime,
                            nightRate: 0,
                        },
                        update: {
                            name: j.name,
                            baseRate: j.baseRate,
                            weekdayRate: j.rates.weekday,
                            saturdayRate: j.rates.saturday,
                            sundayRate: j.rates.sunday,
                            publicHolidayRate: j.rates.public_holiday,
                            overtimeRate: j.rates.overtime,
                        }
                    })
                }
            }

            // 3. Smart Upsert for Shifts
            if (data.shifts?.length) {
                for (const s of data.shifts) {
                    // Only sync if job exists (safeguard)
                    const jobExists = data.jobs?.some(j => j.id === s.jobId)
                    if (!jobExists) continue

                    await tx.shift.upsert({
                        where: { id: s.id },
                        create: {
                            id: s.id,
                            userId,
                            jobId: s.jobId,
                            date: new Date(s.date),
                            startTime: s.startTime,
                            endTime: s.endTime,
                            hours: s.hours,
                            rateType: s.rateType,
                            rate: 0,
                            earnings: s.earnings,
                            note: s.note
                        },
                        update: {
                            jobId: s.jobId,
                            date: new Date(s.date),
                            startTime: s.startTime,
                            endTime: s.endTime,
                            hours: s.hours,
                            rateType: s.rateType,
                            earnings: s.earnings,
                            note: s.note
                        }
                    })
                }
            }

            // 4. Smart Upsert for Expenses
            if (data.expenses?.length) {
                for (const e of data.expenses) {
                    await tx.expense.upsert({
                        where: { id: e.id },
                        create: {
                            id: e.id,
                            userId,
                            date: new Date(e.date),
                            amount: e.amount,
                            description: e.description,
                            category: e.category,
                        },
                        update: {
                            date: new Date(e.date),
                            amount: e.amount,
                            description: e.description,
                            category: e.category,
                        }
                    })
                }
            }

            // 5. Smart Upsert for Goals
            if (data.goals?.length) {
                for (const g of data.goals) {
                    await tx.goal.upsert({
                        where: { id: g.id },
                        create: {
                            id: g.id,
                            userId,
                            name: g.name,
                            targetAmount: g.targetAmount,
                            currentAmount: g.currentAmount,
                            deadline: new Date(g.deadline),
                        },
                        update: {
                            name: g.name,
                            targetAmount: g.targetAmount,
                            currentAmount: g.currentAmount,
                            deadline: new Date(g.deadline),
                        }
                    })
                }
            }

            // 6. Smart Upsert for Budget Categories
            if (data.budgetCategories?.length) {
                for (const b of data.budgetCategories) {
                    await tx.budgetCategory.upsert({
                        where: { id: b.id },
                        create: {
                            id: b.id,
                            userId,
                            name: b.name,
                            budgeted: b.budgeted,
                            color: b.color,
                        },
                        update: {
                            name: b.name,
                            budgeted: b.budgeted,
                            color: b.color,
                        }
                    })
                }
            }

            // 7. Smart Upsert for Attendance Events
            if (data.attendanceEvents?.length) {
                for (const a of data.attendanceEvents) {
                    await tx.attendanceEvent.upsert({
                        where: { id: a.id },
                        create: {
                            id: a.id,
                            userId,
                            date: new Date(a.date),
                            jobId: a.jobId,
                            type: a.type,
                            minutesLate: a.minutesLate,
                            note: a.note
                        },
                        update: {
                            date: new Date(a.date),
                            jobId: a.jobId,
                            type: a.type,
                            minutesLate: a.minutesLate,
                            note: a.note
                        }
                    })
                }
            }

            // 8. Handle deletions (Optional but keeps DB clean)
            // If the incoming payload is considered "exhaustive" for current data,
            // we delete what's in DB but NOT in payload.
            const payloadJobIds = data.jobs?.map(j => j.id) || []
            const payloadShiftIds = data.shifts?.map(s => s.id) || []
            const payloadExpenseIds = data.expenses?.map(e => e.id) || []
            const payloadGoalIds = data.goals?.map(g => g.id) || []
            const payloadBudgetIds = data.budgetCategories?.map(b => b.id) || []
            const payloadAttendanceIds = data.attendanceEvents?.map(a => a.id) || []

            await tx.job.deleteMany({ where: { userId, id: { notIn: payloadJobIds } } })
            await tx.shift.deleteMany({ where: { userId, id: { notIn: payloadShiftIds } } })
            await tx.expense.deleteMany({ where: { userId, id: { notIn: payloadExpenseIds } } })
            await tx.goal.deleteMany({ where: { userId, id: { notIn: payloadGoalIds } } })
            await tx.budgetCategory.deleteMany({ where: { userId, id: { notIn: payloadBudgetIds } } })
            await tx.attendanceEvent.deleteMany({ where: { userId, id: { notIn: payloadAttendanceIds } } })
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return handleDbWriteFailure("sync-save", error)
    }
}
