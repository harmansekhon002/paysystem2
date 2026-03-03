import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ensureUserTableInitialized } from "@/lib/db-init"
import { createTokenPair } from "@/lib/security-tokens"
import { handleDbWriteFailure } from "@/lib/db-resilience"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body?.email ?? "").toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    await ensureUserTableInitialized()

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })

    if (!user) {
      return NextResponse.json({ ok: true, message: "If the account exists, a verification link has been generated." })
    }

    const { token, tokenHash } = createTokenPair()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.$executeRaw`
      UPDATE "User"
      SET "verificationToken" = ${tokenHash},
          "verificationTokenExpires" = ${expiresAt},
          "updatedAt" = NOW()
      WHERE "id" = ${user.id}
    `

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const verificationUrl = `${appUrl}/verify-email?token=${token}`

    return NextResponse.json({
      ok: true,
      message: "Verification link generated.",
      verificationUrl,
    })
  } catch (error) {
    return handleDbWriteFailure("request-email-verification", error)
  }
}
