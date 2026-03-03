import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { ensureUserTableInitialized } from "@/lib/db-init"
import { hashToken } from "@/lib/security-tokens"
import { handleDbWriteFailure } from "@/lib/db-resilience"
import { prepareIdempotency } from "@/lib/idempotency"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = String(body?.token ?? "").trim()
    const password = String(body?.password ?? "")

    if (!token || !password) {
      return NextResponse.json({ error: "Token and new password are required." }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
    }

    const idempotency = await prepareIdempotency({
      req,
      scope: "auth-reset-password",
      ownerKey: token,
      payload: body,
    })
    if (idempotency.replay) {
      return idempotency.replay
    }

    await ensureUserTableInitialized()

    const tokenHash = hashToken(token)
    const [user] = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "User"
      WHERE "resetToken" = ${tokenHash}
        AND "resetTokenExpires" > NOW()
      LIMIT 1
    `

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$executeRaw`
      UPDATE "User"
      SET "passwordHash" = ${passwordHash},
          "resetToken" = NULL,
          "resetTokenExpires" = NULL,
          "updatedAt" = NOW()
      WHERE "id" = ${user.id}
    `

    return idempotency.finish(200, { ok: true, message: "Password reset successfully." })
  } catch (error) {
    return handleDbWriteFailure("reset-password", error)
  }
}
