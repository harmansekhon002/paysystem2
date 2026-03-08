
import { prisma } from "@/lib/prisma"
import { getAdminCredentials } from "@/lib/admin-access"
import { isSpecialUserEmail } from "@/lib/special-user"

export type PLAN_TYPE = "FREE" | "PLUS" | "PRO" | "ADMIN" | "SPECIAL"

export async function getUserPlan(userId: string, email?: string): Promise<PLAN_TYPE> {
    // Admin check
    const adminEmail = getAdminCredentials().email
    if (userId === "admin-root" || (email && email.toLowerCase() === adminEmail.toLowerCase())) {
        return "ADMIN"
    }

    // Special user check
    if (email && isSpecialUserEmail(email)) {
        return "SPECIAL"
    }

    // Check subscription
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
        select: { paypalPlanId: true, status: true }
    })

    if (!subscription || subscription.status !== "active") {
        return "FREE"
    }

    const plusPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLUS_MONTHLY_PLAN_ID ?? ""
    const proPlanId = process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_MONTHLY_PLAN_ID ?? ""

    if (subscription.paypalPlanId === proPlanId) return "PRO"
    if (subscription.paypalPlanId === plusPlanId) return "PLUS"

    return "FREE"
}

export async function checkAiRateLimit(userId: string, feature: string, email?: string) {
    const plan = await getUserPlan(userId, email)

    if (plan === "ADMIN" || plan === "PRO" || plan === "SPECIAL") {
        return { allowed: true, plan }
    }

    const limit = plan === "PLUS" ? 20 : 3
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const usageCount = await prisma.aiUsage.count({
        where: {
            userId,
            timestamp: {
                gte: twentyFourHoursAgo
            }
        }
    })

    if (usageCount >= limit) {
        const firstCallInWindow = await prisma.aiUsage.findFirst({
            where: {
                userId,
                timestamp: {
                    gte: twentyFourHoursAgo
                }
            },
            orderBy: {
                timestamp: "asc"
            }
        })

        const resetAt = firstCallInWindow
            ? new Date(firstCallInWindow.timestamp.getTime() + 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 24 * 60 * 60 * 1000)

        return {
            allowed: false,
            plan: plan.toLowerCase(),
            limit,
            resetAt: resetAt.toISOString(),
            usageCount
        }
    }

    return { allowed: true, plan, limit, usageCount }
}

export async function logAiUsage(userId: string, feature: string, tokensUsed: number = 0) {
    return await prisma.aiUsage.create({
        data: {
            userId,
            feature,
            tokensUsed
        }
    })
}
