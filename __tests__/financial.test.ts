import { describe, it, expect } from "vitest"
import {
  calculateSuperannuation,
  calculateRetirement,
  calculateRequiredMonthlySavings,
  createEqualSplit,
  createCustomSplit,
  createPercentageSplit,
  markSplitAsPaid,
  type SuperannuationConfig,
  type RetirementConfig,
} from "../lib/financial"

describe("Superannuation Calculations", () => {
  it("should calculate correct super contributions", () => {
    const config: SuperannuationConfig = {
      guaranteeRate: 0.115,
      salary: 60000,
      frequency: "annually",
      employeeContribution: 0,
    }

    const result = calculateSuperannuation(config)

    expect(result.employerContribution).toBeCloseTo(6900, 0) // 60000 * 0.115
    expect(result.employeeContribution).toBe(0)
    expect(result.totalContribution).toBeCloseTo(6900, 0)
    expect(result.annualContribution).toBeCloseTo(6900, 0)
  })

  it("should include voluntary contributions", () => {
    const config: SuperannuationConfig = {
      guaranteeRate: 0.115,
      salary: 60000,
      frequency: "annually",
      employeeContribution: 5000,
    }

    const result = calculateSuperannuation(config)

    expect(result.employerContribution).toBeCloseTo(6900, 0)
    expect(result.employeeContribution).toBeCloseTo(5000, 0)
    expect(result.totalContribution).toBeCloseTo(11900, 0)
  })

  it("should respect salary frequency", () => {
    const config: SuperannuationConfig = {
      guaranteeRate: 0.115,
      salary: 5000,
      frequency: "monthly",
    }

    const result = calculateSuperannuation(config)
    expect(result.employerContribution).toBeCloseTo(6900, 0) // 5000 * 12 * 0.115
  })
})

describe("Retirement Calculations", () => {
  it("should calculate retirement projections", () => {
    const config: RetirementConfig = {
      currentAge: 25,
      retirementAge: 65,
      currentSavings: 10000,
      monthlyContribution: 1000,
      annualReturn: 0.07,
      inflationRate: 0.03,
    }

    const result = calculateRetirement(config)

    expect(result.finalBalance).toBeGreaterThan(config.currentSavings)
    expect(result.monthlyIncomeAt4Percent).toBeGreaterThan(0)
    expect(result.projections).toHaveLength(41)
  })

  it("should account for inflation", () => {
    const withInflation: RetirementConfig = {
      currentAge: 25,
      retirementAge: 65,
      currentSavings: 10000,
      monthlyContribution: 1000,
      annualReturn: 0.07,
      inflationRate: 0.03,
    }

    const withoutInflation: RetirementConfig = {
      ...withInflation,
      inflationRate: 0,
    }

    const result1 = calculateRetirement(withInflation)
    const result2 = calculateRetirement(withoutInflation)
    
    expect(result1.inflationAdjustedBalance).toBeLessThan(result2.inflationAdjustedBalance)
  })

  it("should calculate 4% rule income correctly", () => {
    const config: RetirementConfig = {
      currentAge: 25,
      retirementAge: 65,
      currentSavings: 100000,
      monthlyContribution: 0,
      annualReturn: 0.07,
      inflationRate: 0.03,
    }

    const result = calculateRetirement(config)
    
    // 4% rule: annual income = total savings * 0.04
    const expectedAnnualIncome = result.finalBalance * 0.04
    const expectedMonthlyIncome = expectedAnnualIncome / 12

    expect(result.monthlyIncomeAt4Percent).toBeCloseTo(expectedMonthlyIncome, 0)
  })
})

describe("Required Savings Calculations", () => {
  it("should calculate required monthly savings", () => {
    const result = calculateRequiredMonthlySavings(100000, 5, 0.07, 10000)

    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(100000 / (5 * 12)) // Should be less than simple division due to compound interest
  })

  it("should return 0 for already achieved goal", () => {
    const result = calculateRequiredMonthlySavings(10000, 5, 0.07, 15000)

    expect(result).toBeLessThanOrEqual(0)
  })

  it("should handle zero return rate", () => {
    const result = calculateRequiredMonthlySavings(12000, 12, 0, 0)

    // With no return, monthly savings = (target - current) / months
    expect(result).toBeCloseTo(12000 / 144, 0)
  })
})

describe("Split Expenses", () => {
  it("should create equal split", () => {
    const split = createEqualSplit(
      150,
      "Dinner at restaurant",
      "2024-03-01",
      "Food",
      ["Alice", "Bob", "Charlie"]
    )

    expect(split.splits).toHaveLength(3)
    expect(split.splits[0].amount).toBe(50)
    expect(split.splits[1].amount).toBe(50)
    expect(split.splits[2].amount).toBe(50)
    expect(split.totalAmount).toBe(150)
  })

  it("should create custom split", () => {
    const split = createCustomSplit(
      150,
      "Shared shopping",
      "2024-03-02",
      "Shopping",
      [
        { name: "Alice", amount: 70 },
        { name: "Bob", amount: 50 },
        { name: "Charlie", amount: 30 },
      ]
    )

    expect(split?.splits).toHaveLength(3)
    expect(split?.splits[0].amount).toBe(70)
    expect(split?.totalAmount).toBe(150)
  })

  it("should create percentage split", () => {
    const split = createPercentageSplit(
      3000,
      "Monthly rent",
      "2024-03-03",
      "Rent",
      [
        { name: "Alice", percentage: 50 },
        { name: "Bob", percentage: 30 },
        { name: "Charlie", percentage: 20 },
      ]
    )

    expect(split?.splits[0].amount).toBe(1500) // 50%
    expect(split?.splits[1].amount).toBe(900)  // 30%
    expect(split?.splits[2].amount).toBe(600)  // 20%
    expect(split?.totalAmount).toBe(3000)
  })

  it("should mark split as paid", () => {
    const split = createEqualSplit(
      150,
      "Dinner",
      "2024-03-04",
      "Food",
      ["Alice", "Bob", "Charlie"]
    )

    const updated = markSplitAsPaid(split, "Alice")
    
    expect(updated.splits[0].paid).toBe(true)
    expect(updated.splits[1].paid).toBe(false)
    expect(updated.splits[2].paid).toBe(false)
  })

  it("should handle split with remainders", () => {
    const split = createEqualSplit(
      10,
      "Coffee",
      "2024-03-05",
      "Food",
      ["Alice", "Bob", "Charlie"]
    )

    // 10 / 3 = 3.33
    expect(split.splits[0].amount).toBeCloseTo(3.34, 2)
    expect(split.splits[1].amount).toBeCloseTo(3.33, 2)
    expect(split.splits[2].amount).toBeCloseTo(3.33, 2)

    const total = split.splits.reduce((sum, p) => sum + p.amount, 0)
    expect(total).toBeCloseTo(10, 2)
  })
})
