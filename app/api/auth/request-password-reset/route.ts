import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ensureUserTableInitialized } from "@/lib/db-init"
import { createTokenPair } from "@/lib/security-tokens"
import { handleDbWriteFailure } from "@/lib/db-resilience"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

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

      if (process.env.RESEND_API_KEY) {
        try {
          await resend.emails.send({
            from: "ShiftWise <noreply@shiftwise.app>", // Update this verified domain in production
            to: email,
            subject: "Reset your ShiftWise password",
            html: `
              <h2>Password Reset</h2>
              <p>You requested a password reset for your ShiftWise account.</p>
              <p>Click the link below to reset your password. This link is valid for 1 hour.</p>
              <a href="${resetUrl}">Reset Password</a>
              <p>If you didn't request this, you can safely ignore this email.</p>
            `,
          })
        } catch (emailError) {
          console.error("Failed to send reset email:", emailError)
          // We don't fail the request so we don't leak user existence
        }
      } else {
        // Fallback for local dev
        console.log(`[DEV ONLY] Password reset link for ${email}: ${resetUrl}`)
      }

      return NextResponse.json({
        ok: true,
        message: "If an account exists, a reset link has been generated.",
        // We only return the resetUrl in the response for local development testing purposes
        // In production, the user must check their email.
        resetUrl: process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY ? resetUrl : undefined,
      })
    }

    return NextResponse.json({ ok: true, message: "If an account exists, a reset link has been generated." })
  } catch (error) {
    return handleDbWriteFailure("request-password-reset", error)
  }
}
