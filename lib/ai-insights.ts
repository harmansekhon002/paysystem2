import { type Shift, type JobTemplate } from "./store"

export type InsightType = "burnout" | "income" | "productivity" | "opportunity"

export interface AIInsight {
    id: string
    type: InsightType
    title: string
    description: string
    priority: "low" | "medium" | "high"
    actionLabel?: string
    actionLink?: string
}

/**
 * AI Insight Engine (Heuristic-based)
 * Analyzes work patterns to provide premium recommendations.
 */
export function generateAIInsights(shifts: Shift[], jobs: JobTemplate[]): AIInsight[] {
    const insights: AIInsight[] = []
    const now = new Date()

    // Sort shifts by date
    const sortedShifts = [...shifts].sort((a, b) => b.date.localeCompare(a.date))
    const recentShifts = sortedShifts.filter(s => {
        const d = new Date(s.date)
        return (now.getTime() - d.getTime()) <= 30 * 24 * 60 * 60 * 1000 // Last 30 days
    })

    // 1. BURNOUT RISK ANALYSIS
    const burnoutRisk = analyzeBurnoutRisk(recentShifts)
    if (burnoutRisk.priority !== "low") {
        insights.push({
            id: "burnout-risk-01",
            type: "burnout",
            title: burnoutRisk.title,
            description: burnoutRisk.description,
            priority: burnoutRisk.priority,
            actionLabel: "View Schedule",
            actionLink: "/shifts"
        })
    }

    // 2. INCOME TREND ANALYSIS
    const incomeTrend = analyzeIncomeTrends(recentShifts)
    if (incomeTrend) {
        insights.push({
            id: "income-trend-01",
            type: "income",
            title: incomeTrend.title,
            description: incomeTrend.description,
            priority: "medium",
            actionLabel: "View Earnings",
            actionLink: "/earnings"
        })
    }

    // 3. OPPORTUNITY ANALYSIS (Penalty Rates)
    const opportunity = calculatePenaltyOptimisation(recentShifts, jobs)
    if (opportunity) {
        insights.push({
            id: "opportunity-01",
            type: "opportunity",
            title: "Earnings Optimization",
            description: opportunity,
            priority: "low",
            actionLabel: "Compare Rates",
            actionLink: "/reporting"
        })
    }

    return insights
}

function analyzeBurnoutRisk(shifts: Shift[]) {
    if (shifts.length === 0) return { priority: "low" as const, title: "", description: "" }

    const totalHours = shifts.reduce((sum, s) => sum + s.hours, 0)
    const weeklyHours = totalHours / 4 // Approx 4 weeks in 30 days

    // Detect consecutive days worked (Simplified)
    const dates = new Set(shifts.map(s => s.date))
    const sortedDates = Array.from(dates).sort()
    let maxConsecutive = 0
    let currentConsecutive = 0

    for (let i = 0; i < sortedDates.length; i++) {
        const d1 = new Date(sortedDates[i])
        const d2 = i > 0 ? new Date(sortedDates[i - 1]) : null

        if (d2 && (d1.getTime() - d2.getTime()) <= 24 * 60 * 60 * 1000) {
            currentConsecutive++
        } else {
            currentConsecutive = 1
        }
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
    }

    if (maxConsecutive >= 6 || weeklyHours > 45) {
        return {
            priority: "high" as const,
            title: "Critical Burnout Risk",
            description: `You've worked ${maxConsecutive} consecutive days. Your body needs rest to maintain peak productivity. Consider a full day off.`
        }
    }

    if (maxConsecutive >= 4 || weeklyHours > 35) {
        return {
            priority: "medium" as const,
            title: "Burnout Warning",
            description: "You're clocking high hours lately. Make sure you're prioritizing sleep and recovery this weekend."
        }
    }

    return { priority: "low" as const, title: "", description: "" }
}

function analyzeIncomeTrends(shifts: Shift[]) {
    if (shifts.length < 5) return null

    const weeklyEarnings = shifts.reduce((sum, s) => sum + s.earnings, 0) / 4

    if (weeklyEarnings > 0) {
        return {
            title: "Income Growth",
            description: `You're averaging $${weeklyEarnings.toFixed(0)}/week over the last month. You're on track to hit your financial milestones.`
        }
    }

    return null
}

function calculatePenaltyOptimisation(shifts: Shift[], jobs: JobTemplate[]) {
    const sundayEarnings = shifts
        .filter(s => s.rateType === "sunday" || new Date(s.date).getDay() === 0)
        .reduce((sum, s) => sum + s.earnings, 0)

    if (sundayEarnings === 0 && jobs.some(j => j.rates.sunday > j.baseRate)) {
        return "You're missing out on Sunday penalty rates! Picking up even a short Sunday shift could boost your hourly average by up to 50%."
    }

    return null
}
