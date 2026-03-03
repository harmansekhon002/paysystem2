import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleDbWriteFailure } from "@/lib/db-resilience"
import { verifyPayPalWebhookSignature } from "@/lib/paypal-server"

type PayPalWebhookEvent = {
  event_type?: string
  resource?: {
    id?: string
    billing_agreement_id?: string
  }
}

// Webhook endpoint to receive events from PayPal
export async function POST(req: Request) {
  try {
    const isProduction = process.env.NODE_ENV === "production"
    const webhookVerificationConfigured =
      Boolean(process.env.PAYPAL_WEBHOOK_ID?.trim()) &&
      Boolean(process.env.PAYPAL_CLIENT_ID?.trim()) &&
      Boolean(process.env.PAYPAL_CLIENT_SECRET?.trim())

    if (isProduction && !webhookVerificationConfigured) {
      return NextResponse.json(
        { error: "Webhook verification is not configured on the server." },
        { status: 503 }
      )
    }

    const rawBody = await req.text()
    const event = JSON.parse(rawBody) as PayPalWebhookEvent

    if (webhookVerificationConfigured) {
      const verified = await verifyPayPalWebhookSignature(req, event)
      if (!verified) {
        return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 })
      }
    }

    if (!prisma?.subscription) {
      throw new Error('Prisma client is not initialized')
    }

    // Handle different PayPal event types
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subscriptionId = event.resource?.id
        if (!subscriptionId) break
        await prisma.subscription.updateMany({
          where: { paypalSubscriptionId: subscriptionId },
          data: { status: 'canceled', cancelAtPeriodEnd: true }
        })
        console.log(`Subscription ${subscriptionId} cancelled via webhook`)
        break
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        const subscriptionId = event.resource?.id
        if (!subscriptionId) break
        await prisma.subscription.updateMany({
          where: { paypalSubscriptionId: subscriptionId },
          data: { status: 'past_due' }
        })
        console.log(`Payment failed for subscription ${subscriptionId}`)
        break
      }

      case 'PAYMENT.SALE.COMPLETED': {
        // Find the subscription ID linked to the sale.
        // The billing agreement ID is typically included in the custom field or billing_agreement_id
        const subscriptionId = event.resource?.billing_agreement_id

        if (subscriptionId) {
          // Update the current period end 
          // (Requires fetching actual subscription details from PayPal API for exact dates)
          await prisma.subscription.updateMany({
            where: { paypalSubscriptionId: subscriptionId },
            data: {
              status: 'active',
              // Example: extending by 30 days. Needs accurate date from PayPal API.
              paypalCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          })
          console.log(`Payment successful for subscription ${subscriptionId}`)
        }
        break
      }

      // Add other events as needed (e.g., BILLING.SUBSCRIPTION.ACTIVATED)

      default:
        console.log(`Unhandled webhook event: ${event.event_type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return handleDbWriteFailure("paypal-webhook", error)
  }
}
