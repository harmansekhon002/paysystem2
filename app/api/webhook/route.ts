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
        console.info(`[webhook] Subscription cancelled: ${subscriptionId}`)
        break
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        const subscriptionId = event.resource?.id
        if (!subscriptionId) break
        await prisma.subscription.updateMany({
          where: { paypalSubscriptionId: subscriptionId },
          data: { status: 'past_due' }
        })
        console.warn(`[webhook] Payment failed for subscription: ${subscriptionId}`)
        break
      }

      case 'PAYMENT.SALE.COMPLETED': {
        const subscriptionId = event.resource?.billing_agreement_id

        if (subscriptionId) {
          await prisma.subscription.updateMany({
            where: { paypalSubscriptionId: subscriptionId },
            data: {
              status: 'active',
              paypalCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          })
          console.info(`[webhook] Payment successful for subscription: ${subscriptionId}`)
        }
        break
      }

      default:
        // Non-critical: only log in non-production or at debug level
        if (process.env.NODE_ENV !== "production") {
          console.info(`[webhook] Unhandled event type: ${event.event_type}`)
        }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return handleDbWriteFailure("paypal-webhook", error)
  }
}
