// AI/ML utilities for smart categorization and predictions

import { type Expense, type Shift, type JobTemplate } from "./store"

// Expense category prediction using keyword matching (simple ML alternative)
const categoryKeywords: Record<string, string[]> = {
  "Food & Groceries": [
    "woolies",
    "coles",
    "aldi",
    "grocery",
    "supermarket",
    "food",
    "groceries",
    "meal",
    "lunch",
    "dinner",
    "breakfast",
    "cafe",
    "restaurant",
  ],
  "Going Out": [
    "drinks",
    "bar",
    "pub",
    "club",
    "cinema",
    "movie",
    "concert",
    "entertainment",
    "party",
  ],
  "Rent / Housing": ["rent", "landlord", "property", "housing", "utilities", "internet", "electricity", "water"],
  Transport: ["petrol", "gas", "uber", "taxi", "bus", "train", "transport", "parking", "toll"],
  Shopping: ["amazon", "ebay", "clothes", "clothing", "shoes", "fashion", "online"],
  Health: ["pharmacy", "doctor", "medical", "gym", "fitness", "health", "chemist"],
  Education: ["books", "course", "tuition", "university", "textbook", "study"],
}

export function predictExpenseCategory(description: string): string {
  const lowerDesc = description.toLowerCase()
  const scores: Record<string, number> = {}

  // Calculate scores for each category
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    scores[category] = keywords.filter(keyword => lowerDesc.includes(keyword)).length
  }

  // Get category with highest score
  const predicted = Object.entries(scores).reduce((max, [category, score]) => {
    return score > max.score ? { category, score } : max
  }, { category: "Other", score: 0 })

  return predicted.score > 0 ? predicted.category : "Other"
}

// Earnings prediction using linear regression on historical data
export interface EarningsPrediction {
  predictedAmount: number
  confidence: number // 0-1
  trend: "increasing" | "decreasing" | "stable"
  prediction7Days: number
  prediction30Days: number
  prediction90Days: number
}

export function predictEarnings(shifts: Shift[]): EarningsPrediction | null {
  if (shifts.length < 10) {
    return null // Not enough data
  }

  // Sort by date
  const sortedShifts = [...shifts].sort((a, b) => a.date.localeCompare(b.date))

  // Calculate daily averages over time
  const dailyEarnings: Array<{ day: number; earnings: number }> = []
  const baseDate = new Date(sortedShifts[0].date).getTime()

  for (const shift of sortedShifts) {
    const daysSinceStart = Math.floor((new Date(shift.date).getTime() - baseDate) / 86400000)
    const existing = dailyEarnings.find(d => d.day === daysSinceStart)
    if (existing) {
      existing.earnings += shift.earnings
    } else {
      dailyEarnings.push({ day: daysSinceStart, earnings: shift.earnings })
    }
  }

  // Simple linear regression
  const n = dailyEarnings.length
  const sumX = dailyEarnings.reduce((sum, d) => sum + d.day, 0)
  const sumY = dailyEarnings.reduce((sum, d) => sum + d.earnings, 0)
  const sumXY = dailyEarnings.reduce((sum, d) => sum + d.day * d.earnings, 0)
  const sumXX = dailyEarnings.reduce((sum, d) => sum + d.day * d.day, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Determine trend
  let trend: "increasing" | "decreasing" | "stable" = "stable"
  if (slope > 5) trend = "increasing"
  else if (slope < -5) trend = "decreasing"

  // Calculate R² for confidence
  const avgY = sumY / n
  const ssTotal = dailyEarnings.reduce((sum, d) => sum + Math.pow(d.earnings - avgY, 2), 0)
  const ssResidual = dailyEarnings.reduce((sum, d) => {
    const predicted = intercept + slope * d.day
    return sum + Math.pow(d.earnings - predicted, 2)
  }, 0)
  const rSquared = 1 - ssResidual / ssTotal
  const confidence = Math.max(0, Math.min(1, rSquared))

  // Predict future earnings
  const lastDay = dailyEarnings[dailyEarnings.length - 1].day
  const avgDailyEarnings = sumY / n

  return {
    predictedAmount: Math.round((intercept + slope * lastDay) * 100) / 100,
    confidence,
    trend,
    prediction7Days: Math.round((avgDailyEarnings * 7) * 100) / 100,
    prediction30Days: Math.round((avgDailyEarnings * 30) * 100) / 100,
    prediction90Days: Math.round((avgDailyEarnings * 90) * 100) / 100,
  }
}

// Anomaly detection for unusual expenses
export interface Anomaly {
  item: Expense | Shift
  type: "unusually_high" | "unusually_low" | "unusual_timing" | "frequent_duplicate"
  severity: "low" | "medium" | "high"
  message: string
}

export function detectExpenseAnomalies(expenses: Expense[], threshold: number = 2): Anomaly[] {
  const anomalies: Anomaly[] = []

  if (expenses.length < 5) return anomalies

  // Calculate statistics by category
  const categoryStats: Record<string, { amounts: number[]; avg: number; stdDev: number }> = {}

  for (const expense of expenses) {
    if (!categoryStats[expense.category]) {
      categoryStats[expense.category] = { amounts: [], avg: 0, stdDev: 0 }
    }
    categoryStats[expense.category].amounts.push(expense.amount)
  }

  // Calculate avg and std dev
  for (const category of Object.keys(categoryStats)) {
    const amounts = categoryStats[category].amounts
    const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length
    const stdDev = Math.sqrt(variance)
    categoryStats[category].avg = avg
    categoryStats[category].stdDev = stdDev
  }

  // Check each expense
  for (const expense of expenses) {
    const stats = categoryStats[expense.category]
    if (!stats || stats.amounts.length < 3) continue

    const zScore = (expense.amount - stats.avg) / stats.stdDev

    if (zScore > threshold) {
      anomalies.push({
        item: expense,
        type: "unusually_high",
        severity: zScore > 3 ? "high" : "medium",
        message: `This expense is ${zScore.toFixed(1)}x higher than your average for ${expense.category}`,
      })
    }
  }

  // Check for frequent duplicates
  const seenExpenses = new Map<string, number>()
  for (const expense of expenses) {
    const key = `${expense.date}-${expense.amount}-${expense.category}`
    seenExpenses.set(key, (seenExpenses.get(key) || 0) + 1)
  }

  for (const expense of expenses) {
    const key = `${expense.date}-${expense.amount}-${expense.category}`
    const count = seenExpenses.get(key) || 0
    if (count > 1) {
      anomalies.push({
        item: expense,
        type: "frequent_duplicate",
        severity: "medium",
        message: `Potential duplicate expense (appears ${count} times)`,
      })
    }
  }

  return anomalies
}

// Smart shift recommendations
export interface ShiftRecommendation {
  jobId: string
  reason: string
  priority: number // 0-10
}

export function recommendShifts(shifts: Shift[], jobs: JobTemplate[]): ShiftRecommendation[] {
  const recommendations: ShiftRecommendation[] = []

  // Calculate earnings per hour for each job
  const jobStats = jobs.map(job => {
    const jobShifts = shifts.filter(s => s.jobId === job.id)
    const totalEarnings = jobShifts.reduce((sum, s) => sum + s.earnings, 0)
    const totalHours = jobShifts.reduce((sum, s) => sum + s.hours, 0)
    const avgHourly = totalHours > 0 ? totalEarnings / totalHours : 0

    return {
      ...job,
      avgHourly,
      shiftCount: jobShifts.length,
      totalEarnings,
    }
  })

  // Sort by average hourly rate
  const sortedByRate = [...jobStats].sort((a, b) => b.avgHourly - a.avgHourly)

  // Recommend highest paying jobs
  if (sortedByRate.length > 0 && sortedByRate[0].avgHourly > 0) {
    recommendations.push({
      jobId: sortedByRate[0].id,
      reason: `Highest average rate: $${sortedByRate[0].avgHourly.toFixed(2)}/hr`,
      priority: 9,
    })
  }

  // Recommend jobs with weekend/penalty rates
  for (const job of jobStats) {
    const sundayRate = job.rates.sunday
    const publicHolidayRate = job.rates.public_holiday

    if (sundayRate > job.baseRate * 1.3) {
      recommendations.push({
        jobId: job.id,
        reason: `Great Sunday rates (${((sundayRate / job.baseRate) * 100).toFixed(0)}% of base)`,
        priority: 8,
      })
    }

    if (publicHolidayRate > job.baseRate * 1.5) {
      recommendations.push({
        jobId: job.id,
        reason: `Excellent public holiday rates (${((publicHolidayRate / job.baseRate) * 100).toFixed(0)}% of base)`,
        priority: 9,
      })
    }
  }

  // Recommend underutilized jobs
  const avgShiftsPerJob = jobStats.reduce((sum, j) => sum + j.shiftCount, 0) / jobStats.length
  for (const job of jobStats) {
    if (job.shiftCount < avgShiftsPerJob * 0.5 && job.avgHourly > 20) {
      recommendations.push({
        jobId: job.id,
        reason: `Underutilized but decent pay ($${job.avgHourly.toFixed(2)}/hr)`,
        priority: 6,
      })
    }
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5)
}

// Natural language expense parsing
export function parseExpenseFromText(text: string): Partial<Expense> | null {
  // Pattern: "$50 coffee yesterday" or "50 dollars groceries today" or "paid 30 for lunch"
  const patterns = [
    /\$(\d+(?:\.\d{2})?)\s+(?:for\s+)?(.+?)(?:\s+(today|yesterday|tomorrow))?$/i,
    /(\d+(?:\.\d{2})?)\s+dollars?\s+(?:for\s+)?(.+?)(?:\s+(today|yesterday|tomorrow))?$/i,
    /paid\s+(\d+(?:\.\d{2})?)\s+(?:for\s+)?(.+?)(?:\s+(today|yesterday|tomorrow))?$/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const amount = parseFloat(match[1])
      const description = match[2].trim()
      const when = match[3]?.toLowerCase()

      let date = new Date().toISOString().split("T")[0]
      if (when === "yesterday") {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        date = yesterday.toISOString().split("T")[0]
      } else if (when === "tomorrow") {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        date = tomorrow.toISOString().split("T")[0]
      }

      const category = predictExpenseCategory(description)

      return {
        amount,
        description,
        date,
        category,
      }
    }
  }

  return null
}
