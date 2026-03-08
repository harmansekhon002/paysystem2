import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logServerError } from "@/lib/server-ops"
import { sendEmail } from "@/lib/email"
import { WaitlistConfirmationEmail } from "@/emails/WaitlistConfirmationEmail"
import * as React from "react"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, plan } = body

        if (!email || !plan) {
            return NextResponse.json({ error: "Missing email or plan" }, { status: 400 })
        }

        const entry = await prisma.waitlist.create({
            data: {
                email: email.toLowerCase().trim(),
                plan: plan.toLowerCase(),
            },
        })

        // Send confirmation email
        sendEmail({
            to: email,
            subject: "You're on the ShiftWise waitlist! 🎉",
            react: React.createElement(WaitlistConfirmationEmail, { plan: plan })
        }).catch(e => console.error("Waitlist email failed:", e))

        return NextResponse.json({ ok: true, data: entry })
    } catch (error) {
        const errorId = logServerError("waitlist_signup", error)
        return NextResponse.json(
            { error: "Failed to join waitlist. Please try again.", errorId },
            { status: 500 }
        )
    }
}
