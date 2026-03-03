import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { handleDbWriteFailure } from "@/lib/db-resilience"
import { prepareIdempotency } from "@/lib/idempotency"

type ManageAction = "cancel" | "reactivate"

export async function POST(req: NextRequest) {
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

    const body = (await req.json()) as { action?: ManageAction }
    const action = body?.action
    if (action !== "cancel" && action !== "reactivate") {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 })
    }

    const idempotency = await prepareIdempotency({
      req,
      scope: "subscription-manage",
      ownerKey: userId,
      payload: { action },
      ttlHours: 6,
    })
    if (idempotency.replay) {
      return idempotency.replay
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        status: true,
        cancelAtPeriodEnd: true,
      },
    })

    if (!subscription) {
      return idempotency.finish(404, { error: "No active subscription found." })
    }

    if (action === "cancel") {
      if (subscription.cancelAtPeriodEnd) {
        return idempotency.finish(200, { ok: true, message: "Subscription is already set to cancel at period end." })
      }

      await prisma.subscription.update({
        where: { userId },
        data: {
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        },
      })

      return idempotency.finish(200, { ok: true, message: "Subscription will cancel at the end of the current period." })
    }

    if (!subscription.cancelAtPeriodEnd) {
      return idempotency.finish(200, { ok: true, message: "Subscription auto-renew is already enabled." })
    }

    await prisma.subscription.update({
      where: { userId },
      data: {
        status: subscription.status === "canceled" ? "active" : subscription.status,
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      },
    })

    return idempotency.finish(200, { ok: true, message: "Subscription auto-renew has been re-enabled." })
  } catch (error) {
    return handleDbWriteFailure("subscription-manage", error)
  }
}
