import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { logServerError } from "@/lib/server-ops"

function getPlanName(paypalPlanId: string) {
  const plusPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLUS_MONTHLY_PLAN_ID ?? ""
  const proPlanId = process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_MONTHLY_PLAN_ID ?? ""

  if (paypalPlanId === plusPlanId) return "Plus"
  if (paypalPlanId === proPlanId) return "Pro"
  return "Custom"
}

export async function GET(req: NextRequest) {
  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      return NextResponse.json(
        { error: "Server auth configuration is incomplete (NEXTAUTH_SECRET)." },
        { status: 503 }
      )
    }

    const token = await getToken({ req, secret })
    const userId = typeof token?.id === "string" ? token.id : null
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        paypalSubscriptionId: true,
        paypalPlanId: true,
        paypalCurrentPeriodEnd: true,
        status: true,
        cancelAtPeriodEnd: true,
        updatedAt: true,
      },
    })

    if (!subscription) {
      return NextResponse.json({ hasSubscription: false, subscription: null })
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        ...subscription,
        planName: getPlanName(subscription.paypalPlanId),
      },
    })
  } catch (error) {
    const errorId = logServerError("subscription-status", error)
    return NextResponse.json({ error: "Failed to load subscription status.", errorId }, { status: 500 })
  }
}
