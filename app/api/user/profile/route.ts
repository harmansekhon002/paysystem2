import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
    try {
        const secret = process.env.NEXTAUTH_SECRET
        if (!secret) {
            return NextResponse.json(
                { error: "Server auth configuration is incomplete." },
                { status: 503 }
            )
        }

        const token = await getToken({ req, secret })
        const userId = typeof token?.id === "string" ? token.id : null

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { name, email } = body

        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "Name is required." }, { status: 400 })
        }

        if (!email || typeof email !== "string" || !email.includes("@")) {
            return NextResponse.json({ error: "Valid email is required." }, { status: 400 })
        }

        // Check if the new email is already taken by a DIFFERENT user
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (existingUser && existingUser.id !== userId) {
            return NextResponse.json({ error: "This email is already in use by another account." }, { status: 409 })
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim()
            },
            select: {
                name: true,
                email: true
            }
        })

        return NextResponse.json({ success: true, user: updatedUser })

    } catch (error) {
        console.error("[Profile Update] Error updating profile", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
