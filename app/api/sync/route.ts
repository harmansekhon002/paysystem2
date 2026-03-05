import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { handleDbWriteFailure } from "@/lib/db-resilience"
import { AppData, defaultData } from "@/lib/store"

export async function GET(req: NextRequest) {
    try {
        const secret = process.env.NEXTAUTH_SECRET
        if (!secret) return NextResponse.json({ error: "Configuration error" }, { status: 503 })

        const token = await getToken({ req, secret })
        const userId = typeof token?.id === "string" ? token.id : null

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                jobs: true,
                shifts: true,
                expenses: true,
                goals: true,
                budgetCategories: true,
                attendanceEvents: true,
            }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const appData: Partial<AppData> = {
            jobs: user.jobs.map(j => ({
                id: j.id,
                name: j.name,
                category: "custom", // simplify for now, standard jobs have category
                baseRate: j.baseRate,
                rates: {
                    weekday: j.weekdayRate,
                    saturday: j.saturdayRate,
                    sunday: j.sundayRate,
                    public_holiday: j.publicHolidayRate,
                    overtime: j.overtimeRate
                },
                color: "#0d9488"
            })),
            shifts: user.shifts.map(s => ({
                id: s.id,
                date: s.date.toISOString().split('T')[0],
                startTime: s.startTime,
                endTime: s.endTime,
                jobId: s.jobId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                rateType: s.rateType as any,
                breakMinutes: 0,
                hours: s.hours,
                earnings: s.earnings,
                note: s.note || undefined
            })),
            expenses: user.expenses.map(e => ({
                id: e.id,
                category: e.category,
                amount: e.amount,
                description: e.description,
                date: e.date.toISOString().split('T')[0]
            })),
            goals: user.goals.map(g => ({
                id: g.id,
                name: g.name,
                icon: "piggy-bank",
                targetAmount: g.targetAmount,
                currentAmount: g.currentAmount,
                deadline: g.deadline.toISOString().split('T')[0],
            })),
            budgetCategories: user.budgetCategories.map(b => ({
                id: b.id,
                name: b.name,
                budgeted: b.budgeted,
                color: b.color,
            })),
            attendanceEvents: user.attendanceEvents.map(a => ({
                id: a.id,
                date: a.date.toISOString().split('T')[0],
                jobId: a.jobId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: a.type as any,
                minutesLate: a.minutesLate || undefined,
                note: a.note || undefined,
            })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            settings: user.settings ? (user.settings as any) : defaultData.settings,
            publicHolidays: user.publicHolidays ?? defaultData.publicHolidays,
        }

        return NextResponse.json({ data: appData })
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

        const body = await req.json()
        const data: AppData = body.data

        if (!data) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 })
        }

        // Use a transaction to wipe and replace the user's data collections
        await prisma.$transaction(async (tx) => {
            // Update User settings
            await tx.user.update({
                where: { id: userId },
                data: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    settings: data.settings as any,
                    publicHolidays: data.publicHolidays,
                }
            })

            // Wipe existing relations (cascade not needed if manually deleted, but safe)
            await tx.shift.deleteMany({ where: { userId } })
            await tx.job.deleteMany({ where: { userId } })
            await tx.expense.deleteMany({ where: { userId } })
            await tx.goal.deleteMany({ where: { userId } })
            await tx.budgetCategory.deleteMany({ where: { userId } })
            await tx.attendanceEvent.deleteMany({ where: { userId } })

            // Re-insert 
            if (data.jobs?.length) {
                await tx.job.createMany({
                    data: data.jobs.map(j => ({
                        id: j.id,
                        userId,
                        name: j.name,
                        employer: j.name, // stub
                        baseRate: j.baseRate,
                        weekdayRate: j.rates.weekday,
                        saturdayRate: j.rates.saturday,
                        sundayRate: j.rates.sunday,
                        publicHolidayRate: j.rates.public_holiday,
                        overtimeRate: j.rates.overtime,
                        nightRate: 0,
                    }))
                })
            }

            if (data.shifts?.length) {
                await tx.shift.createMany({
                    data: data.shifts.filter(s => data.jobs.some(j => j.id === s.jobId)).map(s => ({
                        id: s.id,
                        userId,
                        jobId: s.jobId,
                        date: new Date(s.date),
                        startTime: s.startTime,
                        endTime: s.endTime,
                        hours: s.hours,
                        rateType: s.rateType,
                        rate: 0, // Should calculate or add to model
                        earnings: s.earnings,
                        note: s.note
                    }))
                })
            }

            if (data.expenses?.length) {
                await tx.expense.createMany({
                    data: data.expenses.map(e => ({
                        id: e.id,
                        userId,
                        date: new Date(e.date),
                        amount: e.amount,
                        description: e.description,
                        category: e.category,
                    }))
                })
            }

            if (data.goals?.length) {
                await tx.goal.createMany({
                    data: data.goals.map(g => ({
                        id: g.id,
                        userId,
                        name: g.name,
                        targetAmount: g.targetAmount,
                        currentAmount: g.currentAmount,
                        deadline: new Date(g.deadline),
                    }))
                })
            }

            if (data.budgetCategories?.length) {
                await tx.budgetCategory.createMany({
                    data: data.budgetCategories.map(b => ({
                        id: b.id,
                        userId,
                        name: b.name,
                        budgeted: b.budgeted,
                        color: b.color,
                    }))
                })
            }

            if (data.attendanceEvents?.length) {
                await tx.attendanceEvent.createMany({
                    data: data.attendanceEvents.map(a => ({
                        id: a.id,
                        userId,
                        date: new Date(a.date),
                        jobId: a.jobId,
                        type: a.type,
                        minutesLate: a.minutesLate,
                        note: a.note
                    }))
                })
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return handleDbWriteFailure("sync-save", error)
    }
}
