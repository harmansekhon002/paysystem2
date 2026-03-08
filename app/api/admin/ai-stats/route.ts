
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { subDays, startOfDay, endOfDay, format } from "date-fns"

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const stats = []
        for (let i = 13; i >= 0; i--) {
            const date = subDays(new Date(), i)
            const dayStart = startOfDay(date)
            const dayEnd = endOfDay(date)

            const count = await prisma.aiUsage.count({
                where: {
                    timestamp: {
                        gte: dayStart,
                        lte: dayEnd
                    }
                }
            })

            stats.push({
                date: dayStart.toISOString(),
                calls: count
            })
        }

        return NextResponse.json(stats)
    } catch (error) {
        console.error("Admin AI stats API error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
