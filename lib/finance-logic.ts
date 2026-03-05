import { type Shift, type JobTemplate, type RateType } from "./store"

/**
 * Calculates earnings for a shift based on job rates or custom rate.
 */
export function calculateEarnings(params: {
    hours: number,
    job: JobTemplate,
    rateType: RateType,
    customRate?: number
}): number {
    const rate = params.customRate ?? params.job.rates[params.rateType]
    return Math.round(params.hours * rate * 100) / 100
}

/**
 * Estimates tax withholding based on Australian tax tables (simplified).
 * Weekly thresholds for 2024-25.
 */
export function estimateTaxAU(weeklyEarnings: number): number {
    // Very simplified AU tax brackets (weekly)
    if (weeklyEarnings <= 350) return 0
    if (weeklyEarnings <= 865) return (weeklyEarnings - 350) * 0.16
    if (weeklyEarnings <= 2500) return 82 + (weeklyEarnings - 865) * 0.30
    return 572 + (weeklyEarnings - 2500) * 0.37
}

/**
 * Calculates superannuation (AU SGC is 11.5% as of July 2024).
 */
export function calculateSuperAU(earnings: number): number {
    const SGC_RATE = 0.115
    return Math.round(earnings * SGC_RATE * 100) / 100
}

/**
 * Common date range filtering logic.
 */
export function getStartDate(timeRange: "week" | "month" | "quarter" | "year", now: Date = new Date()): string {
    const ranges = {
        week: 7,
        month: 30,
        quarter: 90,
        year: 365,
    }
    const date = new Date(now.getTime() - ranges[timeRange] * 24 * 60 * 60 * 1000)
    return date.toISOString().split("T")[0]
}

/**
 * Aggregates analytics from a set of shifts and expenses.
 */
export function computeFinancialAnalytics(shifts: Shift[], expenses: { amount: number }[]) {
    const totalEarnings = shifts.reduce((sum, s) => sum + s.earnings, 0)
    const totalHours = shifts.reduce((sum, s) => sum + s.hours, 0)
    const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const netIncome = totalEarnings - totalExpenses

    return {
        totalEarnings,
        totalHours,
        avgHourlyRate,
        totalExpenses,
        netIncome,
        superGuarantee: calculateSuperAU(totalEarnings)
    }
}
