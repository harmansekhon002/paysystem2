// Premium features and subscription management

export interface PremiumTier {
  id: string
  name: string
  price: number
  interval: "month" | "year"
  features: string[]
  paypalPlanId?: string
}

export const premiumTiers: PremiumTier[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    features: [
      "Up to 50 shifts per month",
      "Basic expense tracking",
      "3 savings goals",
      "7-day data history",
      "Basic analytics",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 4.99,
    interval: "month",
    features: [
      "Unlimited shifts",
      "Advanced expense tracking",
      "Unlimited savings goals",
      "Unlimited data history",
      "Advanced analytics & insights",
      "Google Calendar sync",
      "AI-powered predictions",
      "Shift conflict detection",
      "Split expenses",
      "Export to CSV/PDF",
      "Priority support",
    ],
    paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_MONTHLY_PLAN_ID,
  },
  {
    id: "premium-yearly",
    name: "Premium (Yearly)",
    price: 49.99,
    interval: "year",
    features: [
      "All Premium features",
      "2 months free",
      "Early access to new features",
      "Priority support",
    ],
    paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PREMIUM_YEARLY_PLAN_ID,
  },
]

// Feature flags for premium users
export const premiumFeatures = {
  UNLIMITED_SHIFTS: "unlimited_shifts",
  GOOGLE_CALENDAR_SYNC: "google_calendar_sync",
  AI_PREDICTIONS: "ai_predictions",
  ADVANCED_ANALYTICS: "advanced_analytics",
  SPLIT_EXPENSES: "split_expenses",
  EXPORT_DATA: "export_data",
  SHIFT_CONFLICTS: "shift_conflicts",
  UNLIMITED_GOALS: "unlimited_goals",
  SUPERANNUATION: "superannuation",
  RETIREMENT_CALCULATOR: "retirement_calculator",
} as const

export type PremiumFeature = (typeof premiumFeatures)[keyof typeof premiumFeatures]

// Check if user has access to a feature
export function hasFeatureAccess(
  userTier: string,
  feature: PremiumFeature,
  isPremium: boolean = false
): boolean {
  if (userTier === "free" && !isPremium) {
    // Free tier features
    return false
  }

  // Premium users have access to all features
  if (isPremium || userTier === "premium" || userTier === "premium-yearly") {
    return true
  }

  return false
}

// Limits for free tier
export const freeTierLimits = {
  maxShiftsPerMonth: 50,
  maxGoals: 3,
  dataHistoryDays: 7,
  maxExpensesPerMonth: 100,
}

// Check if user has reached limit
export function checkLimit(
  limitType: keyof typeof freeTierLimits,
  current: number,
  isPremium: boolean
): { allowed: boolean; limit: number; remaining: number } {
  if (isPremium) {
    return { allowed: true, limit: Infinity, remaining: Infinity }
  }

  const limit = freeTierLimits[limitType]
  const remaining = limit - current

  return {
    allowed: current < limit,
    limit,
    remaining: Math.max(0, remaining),
  }
}

// PayPal integration helpers
export async function cancelPayPalSubscription(subscriptionId: string): Promise<void> {
  const response = await fetch("/api/subscription/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscriptionId }),
  })

  if (!response.ok) {
    throw new Error("Failed to cancel subscription")
  }
}

// Usage tracking for free tier
export interface UsageStats {
  shiftsThisMonth: number
  expensesThisMonth: number
  activeGoals: number
  oldestDataDate: string
}

type ShiftLike = { date: string }
type ExpenseLike = { date: string }
type GoalLike = { isCompleted?: boolean }

export function getUsageStats(shifts: ShiftLike[], expenses: ExpenseLike[], goals: GoalLike[]): UsageStats {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const shiftsThisMonth = shifts.filter(s => new Date(s.date) >= startOfMonth).length
  const expensesThisMonth = expenses.filter(e => new Date(e.date) >= startOfMonth).length
  const activeGoals = goals.filter(g => !g.isCompleted).length

  const allDates = [...shifts.map(s => s.date), ...expenses.map(e => e.date)].sort()
  const oldestDataDate = allDates[0] || now.toISOString().split("T")[0]

  return {
    shiftsThisMonth,
    expensesThisMonth,
    activeGoals,
    oldestDataDate,
  }
}

// Premium upsell messages
export const upsellMessages = {
  SHIFT_LIMIT: {
    title: "Shift Limit Reached",
    message: "You've reached the limit of 50 shifts per month on the free plan. Upgrade to Premium for unlimited shifts!",
    ctaText: "Upgrade to Premium",
  },
  GOAL_LIMIT: {
    title: "Goal Limit Reached",
    message: "You can only have 3 active goals on the free plan. Upgrade to Premium for unlimited goals!",
    ctaText: "Upgrade to Premium",
  },
  CALENDAR_SYNC: {
    title: "Premium Feature",
    message: "Google Calendar sync is a Premium feature. Upgrade to automatically sync your shifts!",
    ctaText: "Upgrade to Premium",
  },
  AI_PREDICTIONS: {
    title: "Premium Feature",
    message: "AI-powered predictions and insights are available in Premium. Get smart recommendations!",
    ctaText: "Upgrade to Premium",
  },
  EXPORT_DATA: {
    title: "Premium Feature",
    message: "Export your data to CSV or PDF with Premium. Get detailed reports anytime!",
    ctaText: "Upgrade to Premium",
  },
  SPLIT_EXPENSES: {
    title: "Premium Feature",
    message: "Split expenses with friends is a Premium feature. Track shared costs easily!",
    ctaText: "Upgrade to Premium",
  },
}

export type UpsellType = keyof typeof upsellMessages

// Trial period management
export interface TrialInfo {
  isInTrial: boolean
  trialEndsAt: string | null
  daysRemaining: number
}

export function getTrialInfo(userCreatedAt: string, trialDays: number = 14): TrialInfo {
  const created = new Date(userCreatedAt)
  const trialEnds = new Date(created)
  trialEnds.setDate(trialEnds.getDate() + trialDays)

  const now = new Date()
  const daysRemaining = Math.max(0, Math.ceil((trialEnds.getTime() - now.getTime()) / 86400000))

  return {
    isInTrial: now < trialEnds,
    trialEndsAt: trialEnds.toISOString(),
    daysRemaining,
  }
}

// Feature comparison
export function getFeatureComparison(): Array<{
  feature: string
  free: boolean | string
  premium: boolean | string
}> {
  return [
    { feature: "Shifts per month", free: "50", premium: "Unlimited" },
    { feature: "Expense tracking", free: true, premium: true },
    { feature: "Savings goals", free: "3", premium: "Unlimited" },
    { feature: "Data history", free: "7 days", premium: "Unlimited" },
    { feature: "Basic analytics", free: true, premium: true },
    { feature: "Advanced analytics", free: false, premium: true },
    { feature: "Google Calendar sync", free: false, premium: true },
    { feature: "AI predictions", free: false, premium: true },
    { feature: "Shift conflict detection", free: false, premium: true },
    { feature: "Split expenses", free: false, premium: true },
    { feature: "Export to CSV/PDF", free: false, premium: true },
    { feature: "Superannuation calculator", free: false, premium: true },
    { feature: "Retirement planner", free: false, premium: true },
    { feature: "Priority support", free: false, premium: true },
  ]
}
