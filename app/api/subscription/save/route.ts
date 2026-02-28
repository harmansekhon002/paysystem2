import { NextRequest, NextResponse } from 'next/server'
import { getToken } from "next-auth/jwt"
import { prisma } from '@/lib/prisma'

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

        // We verify the subscription via the PayPal API in a production environment
        // For now, we save it directly to the database.
        if (!prisma?.subscription) throw new Error("Prisma client is not initialized")

        await prisma.subscription.upsert({
            where: { userId },
            update: {
                paypalSubscriptionId: subscriptionId,
                paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_MONTHLY_PLAN_ID || '', // Assuming monthly for now
                status: 'active',
                paypalCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            },
            create: {
                userId,
                paypalSubscriptionId: subscriptionId,
                paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_MONTHLY_PLAN_ID || '',
                status: 'active',
                paypalCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error saving subscription:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
