import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// You would typically get the logged-in user's ID from auth context/session.
// Assuming a mocked user ID for this implementation (replace with actual auth).

export async function POST(req: Request) {
    try {
        const data = await req.json()
        const { subscriptionId } = data

        if (!subscriptionId) {
            return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 })
        }

        // Replace with actual user fetching logic (e.g. NextAuth auth())
        const userId = "mock-user-id" // TODO: Get actual user ID

        // We verify the subscription via the PayPal API in a production environment
        // For now, we save it directly to the database.
        if (!prisma) throw new Error("Prisma client is not initialized")

        await (prisma as any).subscription.upsert({
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
