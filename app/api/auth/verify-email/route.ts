import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ensureUserTableInitialized } from "@/lib/db-init"
import { hashToken } from "@/lib/security-tokens"
import { handleDbWriteFailure } from "@/lib/db-resilience"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = String(body?.token ?? "").trim()

    if (!token) {
      return NextResponse.json({ error: "Verification token is required." }, { status: 400 })
    }

    await ensureUserTableInitialized()

    const tokenHash = hashToken(token)
    const [user] = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "User"
      WHERE "verificationToken" = ${tokenHash}
        AND "verificationTokenExpires" > NOW()
      LIMIT 1
    `

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired verification token." }, { status: 400 })
    }

    await prisma.$executeRaw`
      UPDATE "User"
      SET "emailVerified" = true,
          "verificationToken" = NULL,
          "verificationTokenExpires" = NULL,
          "updatedAt" = NOW()
      WHERE "id" = ${user.id}
    `

    return NextResponse.json({ ok: true, message: "Email verified successfully." })
  } catch (error) {
    return handleDbWriteFailure("verify-email", error)
  }
}
