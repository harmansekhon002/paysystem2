import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// In a real production app, verify the webhook signature here using the PayPal Node SDK.
// Since we are not using the SDK and doing manual fetch calls, we'll implement a 
// basic structure that logs the event and updates the DB if the sub ID matches.

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { event_type, resource } = body

        console.log(`[PayPal Webhook] Received event: ${event_type}`)

        if (!resource || !resource.id) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
        }

        const subscriptionId = resource.id

        // We only care about subscription events
        if (!event_type.startsWith("BILLING.SUBSCRIPTION.")) {
            return NextResponse.json({ received: true })
        }

        const subscription = await prisma.subscription.findUnique({
            where: { paypalSubscriptionId: subscriptionId }
        })

        if (!subscription) {
            console.warn(`[PayPal Webhook] Ignored event for unknown sub: ${subscriptionId}`)
            return NextResponse.json({ received: true })
        }

        let newStatus = subscription.status
        let cancelAtPeriodEnd = subscription.cancelAtPeriodEnd

        switch (event_type) {
            case "BILLING.SUBSCRIPTION.CANCELLED":
                // They cancelled, but might still have time remaining on the period
                newStatus = "canceled"
                cancelAtPeriodEnd = true
                break
            case "BILLING.SUBSCRIPTION.SUSPENDED":
                newStatus = "past_due"
                break
            case "BILLING.SUBSCRIPTION.ACTIVATED":
            case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
                newStatus = "active"
                cancelAtPeriodEnd = false
                break
            case "BILLING.SUBSCRIPTION.EXPIRED":
                newStatus = "canceled"
                break
        }

        await prisma.subscription.update({
            where: { paypalSubscriptionId: subscriptionId },
            data: {
                status: newStatus,
                cancelAtPeriodEnd,
                // In a full implementation, parse resource.billing_info.next_billing_time to update paypalCurrentPeriodEnd
            }
        })

        console.log(`[PayPal Webhook] Updated sub ${subscriptionId} to ${newStatus}`)

        return NextResponse.json({ success: true, status: newStatus })
    } catch (error) {
        console.error("[PayPal Webhook] Error processing event", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
