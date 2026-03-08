
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const entries = await prisma.waitlist.findMany({
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(entries)
    } catch (error) {
        console.error("Admin waitlist API error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
