import { NextRequest, NextResponse } from 'next/server'
import { getToken } from "next-auth/jwt"
import { prisma } from '@/lib/prisma'
import { handleDbWriteFailure } from "@/lib/db-resilience"
import { prepareIdempotency } from "@/lib/idempotency"
import { fetchPayPalSubscription } from "@/lib/paypal-server"

function normalizeSubscriptionStatus(status: string | undefined) {
    const normalized = String(status ?? "").toLowerCase()
    if (normalized === "active") return "active"
    if (normalized === "cancelled" || normalized === "canceled") return "canceled"
    if (normalized === "suspended" || normalized === "past_due") return "past_due"
    return "active"
}

export async function POST(req: NextRequest) {
    try {
        const secret = process.env.NEXTAUTH_SECRET
        if (!secret) {
            return NextResponse.json(
                { error: "Server auth configuration is incomplete (NEXTAUTH_SECRET)." },
                { status: 503 }
            )
        }

        const data = await req.json() as { subscriptionId?: string }
        const { subscriptionId } = data

        if (!subscriptionId) {
            return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 })
        }

        const token = await getToken({ req, secret })
        const userId = typeof token?.id === "string" ? token.id : null
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const idempotency = await prepareIdempotency({
            req,
            scope: "subscription-save",
            ownerKey: userId,
            payload: data,
        })
        if (idempotency.replay) {
            return idempotency.replay
        }

        if (!prisma?.subscription) throw new Error("Prisma client is not initialized")

        const isProduction = process.env.NODE_ENV === "production"
        const clientIdConfigured = Boolean(process.env.PAYPAL_CLIENT_ID?.trim())
        const clientSecretConfigured = Boolean(process.env.PAYPAL_CLIENT_SECRET?.trim())

        let planId = process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_MONTHLY_PLAN_ID || ""
        let currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        let status = "active"

        if (clientIdConfigured && clientSecretConfigured) {
            const subscription = await fetchPayPalSubscription(subscriptionId)
            planId = subscription.plan_id || planId
            if (subscription.billing_info?.next_billing_time) {
                const parsed = new Date(subscription.billing_info.next_billing_time)
                if (!Number.isNaN(parsed.getTime())) {
                    currentPeriodEnd = parsed
                }
            }
            status = normalizeSubscriptionStatus(subscription.status)
        } else if (isProduction) {
            return NextResponse.json(
                { error: "PayPal API credentials are not configured on the server." },
                { status: 503 }
            )
        }

        await prisma.subscription.upsert({
            where: { userId },
            update: {
                paypalSubscriptionId: subscriptionId,
                paypalPlanId: planId,
                status,
                paypalCurrentPeriodEnd: currentPeriodEnd,
            },
            create: {
                userId,
                paypalSubscriptionId: subscriptionId,
                paypalPlanId: planId,
                status,
                paypalCurrentPeriodEnd: currentPeriodEnd,
            }
        })

        return idempotency.finish(200, { success: true })
    } catch (error) {
        return handleDbWriteFailure("subscription-save", error)
    }
}
