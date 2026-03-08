import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ensureUserTableInitialized } from "@/lib/db-init"
import { createTokenPair } from "@/lib/security-tokens"
import { handleDbWriteFailure } from "@/lib/db-resilience"
import { sendEmail } from "@/lib/email"
import { ResetPasswordEmail } from "@/emails/ResetPasswordEmail"
import * as React from "react"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body?.email ?? "").toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    await ensureUserTableInitialized()

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })

    if (user) {
      const { token, tokenHash } = createTokenPair()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await prisma.$executeRaw`
        UPDATE "User"
        SET "resetToken" = ${tokenHash},
            "resetTokenExpires" = ${expiresAt},
            "updatedAt" = NOW()
        WHERE "id" = ${user.id}
      `

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const resetUrl = `${appUrl}/reset-password?token=${token}`

      await sendEmail({
        to: email,
        subject: "Reset your ShiftWise password",
        react: React.createElement(ResetPasswordEmail, { resetLink: resetUrl })
      })

      return NextResponse.json({
        ok: true,
        message: "If an account exists, a reset link has been generated.",
        resetUrl: process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY ? resetUrl : undefined,
      })
    }

    return NextResponse.json({ ok: true, message: "If an account exists, a reset link has been generated." })
  } catch (error) {
    return handleDbWriteFailure("request-password-reset", error)
  }
}
