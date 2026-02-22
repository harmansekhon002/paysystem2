// Financial calculators: Superannuation and Retirement Savings

export interface SuperannuationConfig {
  guaranteeRate: number // e.g., 0.115 for 11.5%
  salary: number
  frequency: "weekly" | "biweekly" | "monthly" | "annually"
  employeeContribution?: number // Additional voluntary contribution
}

export interface SuperannuationResult {
  employerContribution: number
  employeeContribution: number
  totalContribution: number
  annualContribution: number
}

export function calculateSuperannuation(config: SuperannuationConfig): SuperannuationResult {
  const { guaranteeRate, salary, frequency, employeeContribution = 0 } = config

  let annualSalary: number
  switch (frequency) {
    case "weekly":
      annualSalary = salary * 52
      break
    case "biweekly":
      annualSalary = salary * 26
      break
    case "monthly":
      annualSalary = salary * 12
      break
    case "annually":
      annualSalary = salary
      break
  }

  const employerContribution = Math.round(annualSalary * guaranteeRate * 100) / 100
  const totalEmployeeContribution = employeeContribution
  const totalContribution = employerContribution + totalEmployeeContribution

  return {
    employerContribution,
    employeeContribution: totalEmployeeContribution,
    totalContribution,
    annualContribution: totalContribution,
  }
}

export interface RetirementConfig {
  currentAge: number
  retirementAge: number
  currentSavings: number
  monthlyContribution: number
  annualReturn: number // e.g., 0.07 for 7%
  inflationRate: number // e.g., 0.03 for 3%
}

export interface RetirementProjection {
  age: number
  year: number
  balance: number
  contributions: number
  growth: number
  inflationAdjusted: number
}

export interface RetirementResult {
  finalBalance: number
  totalContributions: number
  totalGrowth: number
  inflationAdjustedBalance: number
  monthlyIncomeAt4Percent: number // 4% rule
  projections: RetirementProjection[]
}

export function calculateRetirement(config: RetirementConfig): RetirementResult {
  const {
    currentAge,
    retirementAge,
    currentSavings,
    monthlyContribution,
    annualReturn,
    inflationRate,
  } = config

  const yearsToRetirement = retirementAge - currentAge
  const projections: RetirementProjection[] = []
  let balance = currentSavings
  let totalContributions = 0

  const currentYear = new Date().getFullYear()

  for (let year = 0; year <= yearsToRetirement; year++) {
    const age = currentAge + year
    const yearNumber = currentYear + year

    // Add monthly contributions for the year
    const yearlyContribution = monthlyContribution * 12
    balance += yearlyContribution
    totalContributions += yearlyContribution

    // Calculate growth
    const growthThisYear = balance * annualReturn
    balance += growthThisYear

    // Calculate inflation-adjusted value
    const inflationFactor = Math.pow(1 + inflationRate, year)
    const inflationAdjusted = balance / inflationFactor

    projections.push({
      age,
      year: yearNumber,
      balance: Math.round(balance * 100) / 100,
      contributions: Math.round(totalContributions * 100) / 100,
      growth: Math.round((balance - totalContributions) * 100) / 100,
      inflationAdjusted: Math.round(inflationAdjusted * 100) / 100,
    })
  }

  const finalBalance = balance
  const totalGrowth = finalBalance - currentSavings - totalContributions
  const inflationAdjustedBalance = finalBalance / Math.pow(1 + inflationRate, yearsToRetirement)
  const monthlyIncomeAt4Percent = (finalBalance * 0.04) / 12

  return {
    finalBalance: Math.round(finalBalance * 100) / 100,
    totalContributions: Math.round(totalContributions * 100) / 100,
    totalGrowth: Math.round(totalGrowth * 100) / 100,
    inflationAdjustedBalance: Math.round(inflationAdjustedBalance * 100) / 100,
    monthlyIncomeAt4Percent: Math.round(monthlyIncomeAt4Percent * 100) / 100,
    projections,
  }
}

// How much to save monthly to reach a goal
export function calculateRequiredMonthlySavings(
  targetAmount: number,
  years: number,
  annualReturn: number = 0.07,
  currentSavings: number = 0
): number {
  const months = years * 12
  const monthlyRate = annualReturn / 12

  if (monthlyRate === 0) {
    return (targetAmount - currentSavings) / months
  }

  // Future value of current savings
  const futureValueOfCurrentSavings = currentSavings * Math.pow(1 + monthlyRate, months)

  // Remaining amount needed
  const remainingNeeded = targetAmount - futureValueOfCurrentSavings

  // Calculate monthly payment using future value of annuity formula
  // FV = PMT * [(1 + r)^n - 1] / r
  // PMT = FV * r / [(1 + r)^n - 1]
  const monthlyPayment = (remainingNeeded * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1)

  return Math.round(monthlyPayment * 100) / 100
}

// Split expense calculator
export interface SplitExpense {
  id: string
  totalAmount: number
  description: string
  date: string
  category: string
  splits: Array<{
    name: string
    amount: number
    percentage: number
    paid: boolean
  }>
}

export function createEqualSplit(
  totalAmount: number,
  description: string,
  date: string,
  category: string,
  participants: string[]
): SplitExpense {
  const equalAmount = Math.round((totalAmount / participants.length) * 100) / 100
  const remainder = totalAmount - equalAmount * participants.length

  return {
    id: Math.random().toString(36).substring(2, 9),
    totalAmount,
    description,
    date,
    category,
    splits: participants.map((name, index) => ({
      name,
      amount: index === 0 ? equalAmount + remainder : equalAmount, // Add remainder to first person
      percentage: Math.round((100 / participants.length) * 100) / 100,
      paid: false,
    })),
  }
}

export function createCustomSplit(
  totalAmount: number,
  description: string,
  date: string,
  category: string,
  splits: Array<{ name: string; amount: number }>
): SplitExpense | null {
  const sumOfSplits = splits.reduce((sum, s) => sum + s.amount, 0)

  // Validate that splits add up to total (within 1 cent tolerance)
  if (Math.abs(sumOfSplits - totalAmount) > 0.01) {
    return null
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    totalAmount,
    description,
    date,
    category,
    splits: splits.map(s => ({
      ...s,
      percentage: Math.round((s.amount / totalAmount) * 10000) / 100,
      paid: false,
    })),
  }
}

export function createPercentageSplit(
  totalAmount: number,
  description: string,
  date: string,
  category: string,
  splits: Array<{ name: string; percentage: number }>
): SplitExpense | null {
  const sumOfPercentages = splits.reduce((sum, s) => sum + s.percentage, 0)

  // Validate percentages add up to 100
  if (Math.abs(sumOfPercentages - 100) > 0.01) {
    return null
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    totalAmount,
    description,
    date,
    category,
    splits: splits.map(s => ({
      name: s.name,
      amount: Math.round((totalAmount * s.percentage) / 100 * 100) / 100,
      percentage: s.percentage,
      paid: false,
    })),
  }
}

export function markSplitAsPaid(splitExpense: SplitExpense, participantName: string): SplitExpense {
  return {
    ...splitExpense,
    splits: splitExpense.splits.map(s =>
      s.name === participantName ? { ...s, paid: true } : s
    ),
  }
}

export function getSplitSummary(splitExpense: SplitExpense): { paid: number; unpaid: number; participants: number } {
  const paid = splitExpense.splits.filter(s => s.paid).length
  const unpaid = splitExpense.splits.filter(s => !s.paid).length
  return { paid, unpaid, participants: splitExpense.splits.length }
}
