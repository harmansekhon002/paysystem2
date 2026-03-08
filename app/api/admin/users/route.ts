
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

        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get("page") || "1")
        const search = searchParams.get("search") || ""
        const limit = 10
        const skip = (page - 1) * limit

        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ]
        } : {}

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: (where as any),
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, email: true, createdAt: true, role: true, isPremium: true }
            }),
            prisma.user.count({ where: (where as any) })
        ])

        return NextResponse.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        })
    } catch (error) {
        console.error("Admin users API error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
