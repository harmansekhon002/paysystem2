
import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { checkAiRateLimit } from "@/lib/ai-rate-limit"

export async function GET(req: NextRequest) {
    try {
        const secret = process.env.NEXTAUTH_SECRET
        const token = await getToken({ req, secret })
        const userId = typeof token?.id === "string" ? token.id : null
        const email = token?.email as string | undefined

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const status = await checkAiRateLimit(userId, "general", email)

        return NextResponse.json(status)
    } catch (error) {
        console.error("Usage status error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
