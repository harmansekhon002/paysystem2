import { describe, it, expect } from "vitest"
import {
  validateShift,
  validateExpense,
  validateGoal,
  cleanShift,
  cleanExpense,
  cleanGoal,
  findDuplicateShifts,
  findDuplicateExpenses,
  validateBulkShifts,
  type Shift,
  type Expense,
  type Goal,
} from "../lib/validation"

describe("Shift Validation", () => {
  it("should validate a correct shift", () => {
    const shift: Shift = {
      id: "1",
      jobId: "job1",
      date: "2024-03-15",
      startTime: "09:00",
      endTime: "17:00",
      hours: 8,
      rateType: "weekday",
      breakMinutes: 0,
      earnings: 200,
    }

    const result = validateShift(shift)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("should detect invalid date format", () => {
    const shift: Partial<Shift> = {
      id: "1",
      jobId: "job1",
      date: "15-03-2024", // Wrong format
      startTime: "09:00",
      endTime: "17:00",
      hours: 8,
      rateType: "weekday",
      breakMinutes: 0,
      earnings: 200,
    }

    const result = validateShift(shift)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes("date"))).toBe(true)
  })

  it("should detect invalid hours", () => {
    const shift: Shift = {
      id: "1",
      jobId: "job1",
      date: "2024-03-15",
      startTime: "09:00",
      endTime: "17:00",
      hours: 25, // More than 24
      rateType: "weekday",
      breakMinutes: 0,
      earnings: 200,
    }

    const result = validateShift(shift)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.toLowerCase().includes("hours"))).toBe(true)
  })

  it("should detect negative earnings", () => {
    const shift: Shift = {
      id: "1",
      jobId: "job1",
      date: "2024-03-15",
      startTime: "09:00",
      endTime: "17:00",
      hours: 8,
      rateType: "weekday",
      breakMinutes: 0,
      earnings: -100,
    }

    const result = validateShift(shift)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.toLowerCase().includes("earnings"))).toBe(true)
  })

  it("should warn about unusual break duration", () => {
    const shift: Shift = {
      id: "1",
      jobId: "job1",
      date: "2024-03-15",
      startTime: "09:00",
      endTime: "17:00",
      hours: 8,
      rateType: "weekday",
      breakMinutes: 600,
      earnings: 1200,
    }

    const result = validateShift(shift)
    expect(result.warnings.some(w => w.includes("Break"))).toBe(true)
  })
})

describe("Expense Validation", () => {
  it("should validate a correct expense", () => {
    const expense: Expense = {
      id: "1",
      date: "2024-03-15",
      amount: 50.5,
      description: "Groceries",
      category: "Food & Groceries",
    }

    const result = validateExpense(expense)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("should detect negative amount", () => {
    const expense: Expense = {
      id: "1",
      date: "2024-03-15",
      amount: -50,
      description: "Groceries",
      category: "Food & Groceries",
    }

    const result = validateExpense(expense)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.toLowerCase().includes("amount"))).toBe(true)
  })

  it("should detect empty description", () => {
    const expense: Expense = {
      id: "1",
      date: "2024-03-15",
      amount: 50,
      description: "",
      category: "Food & Groceries",
    }

    const result = validateExpense(expense)
    expect(result.valid).toBe(true)
    expect(result.warnings.some(w => w.includes("Description"))).toBe(true)
  })

  it("should warn about large expense", () => {
    const expense: Expense = {
      id: "1",
      date: "2024-03-15",
      amount: 20000,
      description: "Laptop",
      category: "Shopping",
    }

    const result = validateExpense(expense)
    expect(result.warnings.some(w => w.toLowerCase().includes("large"))).toBe(true)
  })
})

describe("Goal Validation", () => {
  it("should validate a correct goal", () => {
    const goal: Goal = {
      id: "1",
      name: "New Laptop",
      icon: "laptop",
      targetAmount: 2000,
      currentAmount: 500,
      deadline: "2024-12-31",
    }

    const result = validateGoal(goal)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("should detect past deadline", () => {
    const goal: Goal = {
      id: "1",
      name: "New Laptop",
      icon: "laptop",
      targetAmount: 2000,
      currentAmount: 500,
      deadline: "2020-01-01",
    }

    const result = validateGoal(goal)
    expect(result.valid).toBe(true)
    expect(result.warnings.some(w => w.includes("Deadline"))).toBe(true)
  })

  it("should detect current amount exceeding target", () => {
    const goal: Goal = {
      id: "1",
      name: "New Laptop",
      icon: "laptop",
      targetAmount: 2000,
      currentAmount: 2500,
      deadline: "2024-12-31",
    }

    const result = validateGoal(goal)
    expect(result.warnings.some(w => w.includes("exceeds"))).toBe(true)
  })
})

describe("Data Cleaning", () => {
  it("should clean shift by rounding decimals", () => {
    const shift: Shift = {
      id: "1",
      jobId: "job1",
      date: "2024-03-15",
      startTime: "09:00",
      endTime: "17:00",
      hours: 8.123456,
      rateType: "weekday",
      breakMinutes: 30.9,
      earnings: 200.99999,
    }

    const cleaned = cleanShift(shift)
    expect(cleaned.data.hours).toBe(8.12)
    expect(cleaned.data.breakMinutes).toBe(30)
    expect(cleaned.data.earnings).toBe(201)
  })

  it("should clean expense by trimming whitespace", () => {
    const expense: Expense = {
      id: "1",
      date: "2024-03-15",
      amount: 50.999,
      description: "  Groceries  ",
      category: " Food & Groceries ",
    }

    const cleaned = cleanExpense(expense)
    expect(cleaned.data.description).toBe("Groceries")
    expect(cleaned.data.category).toBe("Food & Groceries")
    expect(cleaned.data.amount).toBe(51)
  })

  it("should clean goal by rounding amounts", () => {
    const goal: Goal = {
      id: "1",
      name: "  New Laptop  ",
      icon: "laptop",
      targetAmount: 2000.555,
      currentAmount: 500.999,
      deadline: "2024-12-31",
    }

    const cleaned = cleanGoal(goal)
    expect(cleaned.data.name).toBe("New Laptop")
    expect(cleaned.data.targetAmount).toBe(2000.56)
    expect(cleaned.data.currentAmount).toBe(501)
  })
})

describe("Duplicate Detection", () => {
  it("should find duplicate shifts", () => {
    const shifts: Partial<Shift>[] = [
      {
        id: "1",
        jobId: "job1",
        date: "2024-03-15",
        startTime: "09:00",
        endTime: "17:00",
        hours: 8,
        rateType: "weekday",
        breakMinutes: 0,
        earnings: 200,
      },
      {
        id: "2",
        jobId: "job1",
        date: "2024-03-15",
        startTime: "09:00",
        endTime: "17:00",
        hours: 8,
        rateType: "weekday",
        breakMinutes: 0,
        earnings: 200,
      },
      {
        id: "3",
        jobId: "job2",
        date: "2024-03-16",
        startTime: "10:00",
        endTime: "18:00",
        hours: 8,
        rateType: "weekday",
        breakMinutes: 0,
        earnings: 240,
      },
    ]

    const duplicates = findDuplicateShifts(shifts)
    expect(duplicates).toHaveLength(1)
    expect(duplicates[0].shift.id).toBe("1")
    expect(duplicates[0].duplicates).toHaveLength(1)
    expect(duplicates[0].duplicates[0].id).toBe("2")
  })

  it("should find duplicate expenses", () => {
    const expenses: Expense[] = [
      {
        id: "1",
        date: "2024-03-15",
        amount: 50,
        description: "Groceries",
        category: "Food & Groceries",
      },
      {
        id: "2",
        date: "2024-03-15",
        amount: 50,
        description: "Groceries",
        category: "Food & Groceries",
      },
      {
        id: "3",
        date: "2024-03-16",
        amount: 100,
        description: "Dinner",
        category: "Going Out",
      },
    ]

    const duplicates = findDuplicateExpenses(expenses)
    expect(duplicates).toHaveLength(1)
    expect(duplicates[0].expense.id).toBe("1")
    expect(duplicates[0].duplicates).toHaveLength(1)
    expect(duplicates[0].duplicates[0].id).toBe("2")
  })
})

describe("Bulk Validation", () => {
  it("should validate bulk shifts", () => {
    const shifts: Shift[] = [
      {
        id: "1",
        jobId: "job1",
        date: "2024-03-15",
        startTime: "09:00",
        endTime: "17:00",
        hours: 8,
        rateType: "weekday",
        breakMinutes: 0,
        earnings: 200,
      },
      {
        id: "2",
        jobId: "job1",
        date: "invalid-date",
        startTime: "09:00",
        endTime: "17:00",
        hours: 8,
        rateType: "weekday",
        breakMinutes: 0,
        earnings: 200,
      },
    ]

    const result = validateBulkShifts(shifts)
    expect(result.success).toBe(1)
    expect(result.failed).toBe(1)
    expect(result.errors.map(e => e.index)).toContain(1)
  })
})
