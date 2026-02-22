// Data validation and cleaning utilities

import { type Shift as StoreShift, type Expense as StoreExpense, type Goal as StoreGoal, type JobTemplate } from "./store"

export type Shift = StoreShift
export type Expense = StoreExpense
export type Goal = StoreGoal

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface CleanedData<T> {
  data: T
  changes: string[]
}


// Shift validation
export function validateShift(shift: Partial<StoreShift>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!shift.date || !/^\d{4}-\d{2}-\d{2}$/.test(shift.date)) {
    errors.push("Invalid date format")
  }

  if (!shift.startTime || !/^\d{2}:\d{2}$/.test(shift.startTime)) {
    errors.push("Invalid start time format")
  }

  if (!shift.endTime || !/^\d{2}:\d{2}$/.test(shift.endTime)) {
    errors.push("Invalid end time format")
  }

  if (!shift.jobId || shift.jobId.trim().length === 0) {
    errors.push("Job ID is required")
  }

  if (shift.hours !== undefined && (shift.hours < 0 || shift.hours > 24)) {
    errors.push("Hours must be between 0 and 24")
  }

  if (shift.earnings !== undefined && shift.earnings < 0) {
    errors.push("Earnings cannot be negative")
  }

  if (shift.breakMinutes !== undefined && (shift.breakMinutes < 0 || shift.breakMinutes > 480)) {
    warnings.push("Break duration seems unusual (0-480 min expected)")
  }

  return { valid: errors.length === 0, errors, warnings }
}

// Expense validation
export function validateExpense(expense: Partial<Expense>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!expense.category || expense.category.trim().length === 0) {
    errors.push("Category is required")
  }

  if (expense.amount === undefined || expense.amount <= 0) {
    errors.push("Amount must be greater than 0")
  }

  if (expense.amount !== undefined && expense.amount > 10000) {
    warnings.push("Large expense amount")
  }

  if (!expense.date || !/^\d{4}-\d{2}-\d{2}$/.test(expense.date)) {
    errors.push("Invalid date format")
  }

  if (!expense.description || expense.description.trim().length === 0) {
    warnings.push("Description is empty")
  }

  return { valid: errors.length === 0, errors, warnings }
}

// Goal validation
export function validateGoal(goal: Partial<Goal>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!goal.name || goal.name.trim().length === 0) {
    errors.push("Goal name is required")
  }

  if (goal.targetAmount === undefined || goal.targetAmount <= 0) {
    errors.push("Target amount must be greater than 0")
  }

  if (goal.currentAmount !== undefined && goal.currentAmount < 0) {
    errors.push("Current amount cannot be negative")
  }

  if (goal.currentAmount !== undefined && goal.targetAmount !== undefined && goal.currentAmount > goal.targetAmount) {
    warnings.push("Current amount exceeds target")
  }

  if (!goal.deadline || !/^\d{4}-\d{2}-\d{2}$/.test(goal.deadline)) {
    errors.push("Invalid deadline format")
  }

  if (goal.deadline) {
    const deadline = new Date(goal.deadline)
    const now = new Date()
    if (deadline < now) {
      warnings.push("Deadline is in the past")
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

// Job validation
export function validateJob(job: Partial<JobTemplate>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!job.name || job.name.trim().length === 0) {
    errors.push("Job name is required")
  }

  if (job.baseRate === undefined || job.baseRate < 0) {
    errors.push("Base rate must be 0 or greater")
  }

  if (job.baseRate !== undefined && job.baseRate < 10) {
    warnings.push("Base rate seems low")
  }

  if (job.baseRate !== undefined && job.baseRate > 200) {
    warnings.push("Base rate seems unusually high")
  }

  if (job.rates) {
    if (job.rates.weekday < 0) errors.push("Weekday rate cannot be negative")
    if (job.rates.saturday < 0) errors.push("Saturday rate cannot be negative")
    if (job.rates.sunday < 0) errors.push("Sunday rate cannot be negative")
    if (job.rates.public_holiday < 0) errors.push("Public holiday rate cannot be negative")
    if (job.rates.overtime < 0) errors.push("Overtime rate cannot be negative")
  }

  return { valid: errors.length === 0, errors, warnings }
}

// Data cleaning functions
export function cleanShift(shift: Shift): CleanedData<Shift> {
  const changes: string[] = []
  const cleaned = { ...shift }

  // Trim strings
  if (cleaned.note && cleaned.note !== cleaned.note.trim()) {
    cleaned.note = cleaned.note.trim()
    changes.push("Trimmed note whitespace")
  }

  // Round numbers
  if (cleaned.hours !== Math.round(cleaned.hours * 100) / 100) {
    cleaned.hours = Math.round(cleaned.hours * 100) / 100
    changes.push("Rounded hours to 2 decimals")
  }

  if (cleaned.earnings !== Math.round(cleaned.earnings * 100) / 100) {
    cleaned.earnings = Math.round(cleaned.earnings * 100) / 100
    changes.push("Rounded earnings to 2 decimals")
  }

  // Ensure breakMinutes is integer
  if (cleaned.breakMinutes !== Math.floor(cleaned.breakMinutes)) {
    cleaned.breakMinutes = Math.floor(cleaned.breakMinutes)
    changes.push("Rounded break minutes to integer")
  }

  return { data: cleaned, changes }
}

export function cleanExpense(expense: Expense): CleanedData<Expense> {
  const changes: string[] = []
  const cleaned = { ...expense }

  // Trim strings
  if (cleaned.category !== cleaned.category.trim()) {
    cleaned.category = cleaned.category.trim()
    changes.push("Trimmed category whitespace")
  }

  if (cleaned.description !== cleaned.description.trim()) {
    cleaned.description = cleaned.description.trim()
    changes.push("Trimmed description whitespace")
  }

  // Round amount
  if (cleaned.amount !== Math.round(cleaned.amount * 100) / 100) {
    cleaned.amount = Math.round(cleaned.amount * 100) / 100
    changes.push("Rounded amount to 2 decimals")
  }

  return { data: cleaned, changes }
}

export function cleanGoal(goal: Goal): CleanedData<Goal> {
  const changes: string[] = []
  const cleaned = { ...goal }

  // Trim name
  if (cleaned.name !== cleaned.name.trim()) {
    cleaned.name = cleaned.name.trim()
    changes.push("Trimmed name whitespace")
  }

  // Round amounts
  if (cleaned.targetAmount !== Math.round(cleaned.targetAmount * 100) / 100) {
    cleaned.targetAmount = Math.round(cleaned.targetAmount * 100) / 100
    changes.push("Rounded target amount to 2 decimals")
  }

  if (cleaned.currentAmount !== Math.round(cleaned.currentAmount * 100) / 100) {
    cleaned.currentAmount = Math.round(cleaned.currentAmount * 100) / 100
    changes.push("Rounded current amount to 2 decimals")
  }

  return { data: cleaned, changes }
}

// Duplicate detection
export function findDuplicateShifts(shifts: Shift[]): Array<{ shift: Shift; duplicates: Shift[] }> {
  const duplicates: Array<{ shift: Shift; duplicates: Shift[] }> = []
  const processed = new Set<string>()

  for (let i = 0; i < shifts.length; i++) {
    if (processed.has(shifts[i].id)) continue

    const matches = shifts.filter((s, idx) => {
      if (idx <= i || processed.has(s.id)) return false
      return (
        s.date === shifts[i].date &&
        s.startTime === shifts[i].startTime &&
        s.endTime === shifts[i].endTime &&
        s.jobId === shifts[i].jobId
      )
    })

    if (matches.length > 0) {
      duplicates.push({ shift: shifts[i], duplicates: matches })
      processed.add(shifts[i].id)
      matches.forEach(m => processed.add(m.id))
    }
  }

  return duplicates
}

export function findDuplicateExpenses(expenses: Expense[]): Array<{ expense: Expense; duplicates: Expense[] }> {
  const duplicates: Array<{ expense: Expense; duplicates: Expense[] }> = []
  const processed = new Set<string>()

  for (let i = 0; i < expenses.length; i++) {
    if (processed.has(expenses[i].id)) continue

    const matches = expenses.filter((e, idx) => {
      if (idx <= i || processed.has(e.id)) return false
      return (
        e.date === expenses[i].date &&
        e.category === expenses[i].category &&
        Math.abs(e.amount - expenses[i].amount) < 0.01 &&
        e.description === expenses[i].description
      )
    })

    if (matches.length > 0) {
      duplicates.push({ expense: expenses[i], duplicates: matches })
      processed.add(expenses[i].id)
      matches.forEach(m => processed.add(m.id))
    }
  }

  return duplicates
}

// Bulk operation helpers
export interface BulkOperationResult {
  success: number
  failed: number
  errors: Array<{ index: number; error: string }>
}

export function validateBulkShifts(shifts: Partial<Shift>[]): BulkOperationResult {
  const result: BulkOperationResult = { success: 0, failed: 0, errors: [] }

  shifts.forEach((shift, index) => {
    const validation = validateShift(shift)
    if (validation.valid) {
      result.success++
    } else {
      result.failed++
      result.errors.push({ index, error: validation.errors.join(", ") })
    }
  })

  return result
}

export function validateBulkExpenses(expenses: Partial<Expense>[]): BulkOperationResult {
  const result: BulkOperationResult = { success: 0, failed: 0, errors: [] }

  expenses.forEach((expense, index) => {
    const validation = validateExpense(expense)
    if (validation.valid) {
      result.success++
    } else {
      result.failed++
      result.errors.push({ index, error: validation.errors.join(", ") })
    }
  })

  return result
}
