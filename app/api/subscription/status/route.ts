import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { logServerError } from "@/lib/server-ops"
import { getAdminCredentials } from "@/lib/admin-access"
import { isSpecialUserEmail } from "@/lib/special-user"

function getPlanName(paypalPlanId: string) {
  const plusPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLUS_MONTHLY_PLAN_ID ?? ""
  const proPlanId = process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_MONTHLY_PLAN_ID ?? ""

  if (paypalPlanId === plusPlanId) return "Plus"
  if (paypalPlanId === proPlanId) return "Pro"
  return "Custom"
}

function getPrismaErrorCode(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error && typeof (error as { code?: unknown }).code === "string") {
    return (error as { code: string }).code
  }
  return null
}

function isRecoverableSubscriptionReadError(error: unknown): boolean {
  const code = getPrismaErrorCode(error)
  if (!code) return false
  return code === "P2022" || code === "P1001"
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
    const tokenEmail = typeof token?.email === "string" ? token.email.toLowerCase().trim() : null
    const adminEmail = getAdminCredentials().email
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (userId === "admin-root" || tokenEmail === adminEmail) {
      const now = new Date()
      const nextYear = new Date(now)
      nextYear.setFullYear(now.getFullYear() + 1)
      return NextResponse.json({
        hasSubscription: true,
        subscription: {
          paypalSubscriptionId: "admin-unlimited",
          paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_MONTHLY_PLAN_ID ?? "admin-pro",
          paypalCurrentPeriodEnd: nextYear.toISOString(),
          status: "active",
          cancelAtPeriodEnd: false,
          updatedAt: now.toISOString(),
          planName: "Admin",
        },
      })
    }

    const isSpecialUser = token?.isSpecialUser === true || (tokenEmail ? isSpecialUserEmail(tokenEmail) : false)
    if (isSpecialUser) {
      const now = new Date()
      return NextResponse.json({
        hasSubscription: true,
        subscription: {
          paypalSubscriptionId: "special-lifetime",
          paypalPlanId: "special-lifetime",
          paypalCurrentPeriodEnd: "2099-12-31T00:00:00.000Z",
          status: "lifetime",
          cancelAtPeriodEnd: false,
          updatedAt: now.toISOString(),
          planName: "Lifetime",
        },
      })
    }

    let subscription: {
      paypalSubscriptionId: string
      paypalPlanId: string
      paypalCurrentPeriodEnd: Date
      status: string
      cancelAtPeriodEnd: boolean
      updatedAt: Date
    } | null = null

    try {
      subscription = await prisma.subscription.findUnique({
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
    } catch (error) {
      if (isRecoverableSubscriptionReadError(error)) {
        return NextResponse.json({
          hasSubscription: false,
          subscription: null,
          degraded: true,
          message: "Subscription status is temporarily unavailable. Showing free plan by default.",
        })
      }
      throw error
    }

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
