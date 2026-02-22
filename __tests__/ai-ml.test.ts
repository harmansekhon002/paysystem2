import { describe, it, expect } from "vitest"
import {
  predictExpenseCategory,
  predictEarnings,
  detectExpenseAnomalies,
  recommendShifts,
  parseExpenseFromText,
} from "../lib/ai-ml"
import { type Expense, type Shift, type JobTemplate } from "../lib/store"

describe("Expense Category Prediction", () => {
  it("should predict food category", () => {
    expect(predictExpenseCategory("Woolies groceries")).toBe("Food & Groceries")
    expect(predictExpenseCategory("Lunch at cafe")).toBe("Food & Groceries")
    expect(predictExpenseCategory("Dinner with friends")).toBe("Food & Groceries")
  })

  it("should predict transport category", () => {
    expect(predictExpenseCategory("Uber to work")).toBe("Transport")
    expect(predictExpenseCategory("Petrol station")).toBe("Transport")
    expect(predictExpenseCategory("Train ticket")).toBe("Transport")
  })

  it("should predict going out category", () => {
    expect(predictExpenseCategory("Drinks at bar")).toBe("Going Out")
    expect(predictExpenseCategory("Cinema tickets")).toBe("Going Out")
    expect(predictExpenseCategory("Concert")).toBe("Going Out")
  })

  it("should return Other for unknown categories", () => {
    expect(predictExpenseCategory("Random stuff")).toBe("Other")
    expect(predictExpenseCategory("xyz123")).toBe("Other")
  })
})

describe("Earnings Prediction", () => {
  const shifts: Shift[] = Array.from({ length: 30 }, (_, i) => ({
    id: String(i),
    jobId: "job1",
    date: new Date(2024, 2, i + 1).toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "17:00",
    hours: 8,
    rateType: "weekday",
    breakMinutes: 0,
    earnings: 200 + i * 10, // Increasing trend
  }))

  it("should predict earnings trend", () => {
    const prediction = predictEarnings(shifts)
    
    expect(prediction).toBeDefined()
    expect(prediction?.trend).toBe("increasing")
    expect(prediction?.confidence).toBeGreaterThan(0)
  })

  it("should return null for insufficient data", () => {
    const fewShifts: Shift[] = shifts.slice(0, 5)
    const prediction = predictEarnings(fewShifts)
    
    expect(prediction).toBeNull()
  })

  it("should predict future earnings", () => {
    const prediction = predictEarnings(shifts)
    
    expect(prediction).toBeDefined()
    expect(prediction?.prediction7Days).toBeGreaterThan(0)
    expect(prediction?.prediction30Days).toBeGreaterThan(prediction!.prediction7Days)
    expect(prediction?.prediction90Days).toBeGreaterThan(prediction!.prediction30Days)
  })

  it("should detect decreasing trend", () => {
    const decreasingShifts: Shift[] = Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      jobId: "job1",
      date: new Date(2024, 2, i + 1).toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "17:00",
      hours: 8,
      rateType: "weekday",
      breakMinutes: 0,
      earnings: 400 - i * 10, // Decreasing trend
    }))

    const prediction = predictEarnings(decreasingShifts)
    
    expect(prediction?.trend).toBe("decreasing")
  })
})

describe("Anomaly Detection", () => {
  const normalExpenses: Expense[] = [
    { id: "1", date: "2024-03-01", amount: 50, description: "Groceries", category: "Food & Groceries" },
    { id: "2", date: "2024-03-08", amount: 55, description: "Groceries", category: "Food & Groceries" },
    { id: "3", date: "2024-03-15", amount: 48, description: "Groceries", category: "Food & Groceries" },
    { id: "4", date: "2024-03-22", amount: 52, description: "Groceries", category: "Food & Groceries" },
  ]

  it("should detect unusually high expenses", () => {
    const expensesWithAnomaly: Expense[] = [
      ...normalExpenses,
      { id: "5", date: "2024-03-29", amount: 1000, description: "Expensive groceries", category: "Food & Groceries" },
    ]

    const anomalies = detectExpenseAnomalies(expensesWithAnomaly, 1.5)
    
    const highAnomaly = anomalies.find(a => a.type === "unusually_high")
    expect(highAnomaly).toBeDefined()
    expect(highAnomaly?.item.id).toBe("5")
  })

  it("should detect duplicate expenses", () => {
    const duplicateExpenses: Expense[] = [
      ...normalExpenses,
      { id: "5", date: "2024-03-15", amount: 50, description: "Groceries", category: "Food & Groceries" },
      { id: "6", date: "2024-03-15", amount: 50, description: "Groceries", category: "Food & Groceries" },
    ]

    const anomalies = detectExpenseAnomalies(duplicateExpenses)
    
    const duplicateAnomalies = anomalies.filter(a => a.type === "frequent_duplicate")
    expect(duplicateAnomalies.length).toBeGreaterThan(0)
  })

  it("should return empty array for insufficient data", () => {
    const fewExpenses: Expense[] = normalExpenses.slice(0, 3)
    const anomalies = detectExpenseAnomalies(fewExpenses)
    
    expect(anomalies).toHaveLength(0)
  })
})

describe("Shift Recommendations", () => {
  const shifts: Shift[] = [
    { id: "1", jobId: "job1", date: "2024-03-01", startTime: "09:00", endTime: "17:00", hours: 8, rateType: "weekday", breakMinutes: 0, earnings: 200 },
    { id: "2", jobId: "job1", date: "2024-03-08", startTime: "09:00", endTime: "17:00", hours: 8, rateType: "weekday", breakMinutes: 0, earnings: 200 },
    { id: "3", jobId: "job2", date: "2024-03-15", startTime: "09:00", endTime: "17:00", hours: 8, rateType: "weekday", breakMinutes: 0, earnings: 240 },
  ]

  const jobs: JobTemplate[] = [
    {
      id: "job1",
      name: "Cafe",
      category: "hospitality",
      baseRate: 25,
      rates: { weekday: 25, saturday: 30, sunday: 35, public_holiday: 50, overtime: 37.5 },
      color: "#0d9488",
    },
    {
      id: "job2",
      name: "Retail",
      category: "retail",
      baseRate: 30,
      rates: { weekday: 30, saturday: 40, sunday: 45, public_holiday: 60, overtime: 45 },
      color: "#6366f1",
    },
  ]

  it("should recommend highest paying job", () => {
    const recommendations = recommendShifts(shifts, jobs)
    
    expect(recommendations.length).toBeGreaterThan(0)
    
    const topRecommendation = recommendations[0]
    expect(topRecommendation.jobId).toBe("job2") // Higher average rate
    expect(topRecommendation.priority).toBeGreaterThan(5)
  })

  it("should recommend jobs with good penalty rates", () => {
    const recommendations = recommendShifts(shifts, jobs)
    
    const penaltyRateRecommendation = recommendations.find(r => 
      r.reason.toLowerCase().includes("sunday") || 
      r.reason.toLowerCase().includes("holiday")
    )
    
    expect(penaltyRateRecommendation).toBeDefined()
  })

  it("should limit recommendations", () => {
    const recommendations = recommendShifts(shifts, jobs)
    
    expect(recommendations.length).toBeLessThanOrEqual(5)
  })
})

describe("Natural Language Expense Parsing", () => {
  it("should parse expense with dollar sign", () => {
    const expense = parseExpenseFromText("$50 coffee")
    
    expect(expense).toBeDefined()
    expect(expense?.amount).toBe(50)
    expect(expense?.description).toBe("coffee")
  })

  it("should parse expense with 'dollars'", () => {
    const expense = parseExpenseFromText("25 dollars for groceries")
    
    expect(expense).toBeDefined()
    expect(expense?.amount).toBe(25)
    expect(expense?.description).toBe("groceries")
  })

  it("should parse expense with 'paid'", () => {
    const expense = parseExpenseFromText("paid 30 for lunch")
    
    expect(expense).toBeDefined()
    expect(expense?.amount).toBe(30)
    expect(expense?.description).toBe("lunch")
  })

  it("should handle 'yesterday'", () => {
    const expense = parseExpenseFromText("$50 dinner yesterday")
    
    expect(expense).toBeDefined()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(expense?.date).toBe(yesterday.toISOString().split("T")[0])
  })

  it("should predict category from description", () => {
    const expense = parseExpenseFromText("$50 woolies")
    
    expect(expense).toBeDefined()
    expect(expense?.category).toBe("Food & Groceries")
  })

  it("should return null for invalid input", () => {
    const expense = parseExpenseFromText("random text without numbers")
    
    expect(expense).toBeNull()
  })

  it("should handle decimal amounts", () => {
    const expense = parseExpenseFromText("$12.50 coffee")
    
    expect(expense).toBeDefined()
    expect(expense?.amount).toBe(12.50)
  })
})
