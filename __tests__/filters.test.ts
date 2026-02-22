import { describe, it, expect, beforeEach } from "vitest"
import {
  applyFilters,
  fuzzySearch,
  multiSort,
  getDateRange,
  groupBy,
  aggregate,
  saveFilterPreset,
  getFilterPresets,
  deleteFilterPreset,
  type FilterRule,
  type FilterPreset,
  type SortConfig,
} from "../lib/filters"
import type { Shift, Expense } from "../lib/store"

describe("Filter Rules", () => {
  const shifts: Shift[] = [
    { id: "1", jobId: "job1", date: "2024-03-15", startTime: "09:00", endTime: "17:00", hours: 8, rateType: "weekday", breakMinutes: 0, earnings: 200 },
    { id: "2", jobId: "job2", date: "2024-03-16", startTime: "09:00", endTime: "15:00", hours: 6, rateType: "saturday", breakMinutes: 0, earnings: 210 },
    { id: "3", jobId: "job1", date: "2024-03-17", startTime: "09:00", endTime: "17:00", hours: 8, rateType: "sunday", breakMinutes: 0, earnings: 320 },
  ]

  it("should filter with equals operator", () => {
    const rules: FilterRule[] = [{ field: "jobId", operator: "equals", value: "job1" }]
    const filtered = applyFilters(shifts, rules)

    expect(filtered).toHaveLength(2)
    expect(filtered.every(s => s.jobId === "job1")).toBe(true)
  })

  it("should filter with greater_than operator", () => {
    const rules: FilterRule[] = [{ field: "earnings", operator: "greater_than", value: 200 }]
    const filtered = applyFilters(shifts, rules)

    expect(filtered).toHaveLength(2)
    expect(filtered.every(s => s.earnings > 200)).toBe(true)
  })

  it("should filter with less_than operator", () => {
    const rules: FilterRule[] = [{ field: "hours", operator: "less_than", value: 8 }]
    const filtered = applyFilters(shifts, rules)

    expect(filtered).toHaveLength(1)
    expect(filtered[0].hours).toBe(6)
  })

  it("should filter with contains operator", () => {
    const expenses: Expense[] = [
      { id: "1", date: "2024-03-15", amount: 50, description: "Woolies groceries", category: "Food & Groceries" },
      { id: "2", date: "2024-03-16", amount: 30, description: "Coffee", category: "Food & Groceries" },
      { id: "3", date: "2024-03-17", amount: 100, description: "Uber ride", category: "Transport" },
    ]

    const rules: FilterRule[] = [{ field: "description", operator: "contains", value: "coffee" }]
    const filtered = applyFilters(expenses, rules)

    expect(filtered).toHaveLength(1)
    expect(filtered[0].description).toBe("Coffee")
  })

  it("should filter with between operator", () => {
    const rules: FilterRule[] = [{ field: "earnings", operator: "between", value: [200, 250] }]
    const filtered = applyFilters(shifts, rules)

    expect(filtered).toHaveLength(2)
    expect(filtered.every(s => s.earnings >= 200 && s.earnings <= 250)).toBe(true)
  })

  it("should filter with in operator", () => {
    const rules: FilterRule[] = [{ field: "rateType", operator: "in", value: ["saturday", "sunday"] }]
    const filtered = applyFilters(shifts, rules)

    expect(filtered).toHaveLength(2)
    expect(filtered.every(s => s.rateType === "saturday" || s.rateType === "sunday")).toBe(true)
  })

  it("should apply multiple rules with AND logic", () => {
    const rules: FilterRule[] = [
      { field: "jobId", operator: "equals", value: "job1" },
      { field: "earnings", operator: "greater_than", value: 250 },
    ]
    const filtered = applyFilters(shifts, rules)

    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe("3")
  })

  it("should return all items with no rules", () => {
    const filtered = applyFilters(shifts, [])
    expect(filtered).toHaveLength(shifts.length)
  })
})

describe("Fuzzy Search", () => {
  const expenses: Expense[] = [
    { id: "1", date: "2024-03-15", amount: 50, description: "Woolworths groceries", category: "Food & Groceries" },
    { id: "2", date: "2024-03-16", amount: 30, description: "Coffee at cafe", category: "Food & Groceries" },
    { id: "3", date: "2024-03-17", amount: 100, description: "Uber to work", category: "Transport" },
    { id: "4", date: "2024-03-18", amount: 75, description: "Restaurant dinner", category: "Going Out" },
  ]

  it("should find exact matches", () => {
    const results = fuzzySearch(expenses, "uber", ["description"])

    expect(results).toHaveLength(1)
    expect(results[0].description).toBe("Uber to work")
  })

  it("should be case-insensitive", () => {
    const results = fuzzySearch(expenses, "COFFEE", ["description"])

    expect(results).toHaveLength(1)
    expect(results[0].description).toBe("Coffee at cafe")
  })

  it("should match multiple words", () => {
    const results = fuzzySearch(expenses, "cafe coffee", ["description"])

    expect(results).toHaveLength(1)
    expect(results[0].description).toBe("Coffee at cafe")
  })

  it("should search multiple fields", () => {
    const results = fuzzySearch(expenses, "transport", ["description", "category"])

    expect(results).toHaveLength(1)
    expect(results[0].category).toBe("Transport")
  })

  it("should return all items with empty query", () => {
    const results = fuzzySearch(expenses, "", ["description"])
    expect(results).toHaveLength(expenses.length)
  })
})

describe("Multi-field Sorting", () => {
  const shifts: Shift[] = [
    { id: "1", jobId: "job1", date: "2024-03-15", startTime: "09:00", endTime: "17:00", hours: 8, rateType: "weekday", breakMinutes: 0, earnings: 200 },
    { id: "2", jobId: "job2", date: "2024-03-15", startTime: "09:00", endTime: "15:00", hours: 6, rateType: "saturday", breakMinutes: 0, earnings: 210 },
    { id: "3", jobId: "job1", date: "2024-03-16", startTime: "09:00", endTime: "17:00", hours: 8, rateType: "sunday", breakMinutes: 0, earnings: 320 },
  ]

  it("should sort by single field ascending", () => {
    const sorts: SortConfig[] = [{ field: "earnings", direction: "asc" }]
    const sorted = multiSort(shifts, sorts)

    expect(sorted[0].earnings).toBe(200)
    expect(sorted[1].earnings).toBe(210)
    expect(sorted[2].earnings).toBe(320)
  })

  it("should sort by single field descending", () => {
    const sorts: SortConfig[] = [{ field: "earnings", direction: "desc" }]
    const sorted = multiSort(shifts, sorts)

    expect(sorted[0].earnings).toBe(320)
    expect(sorted[1].earnings).toBe(210)
    expect(sorted[2].earnings).toBe(200)
  })

  it("should sort by multiple fields", () => {
    const sorts: SortConfig[] = [
      { field: "date", direction: "asc" },
      { field: "earnings", direction: "desc" },
    ]
    const sorted = multiSort(shifts, sorts)

    // First by date, then by earnings (desc) within same date
    expect(sorted[0].date).toBe("2024-03-15")
    expect(sorted[0].earnings).toBe(210)
    expect(sorted[1].date).toBe("2024-03-15")
    expect(sorted[1].earnings).toBe(200)
    expect(sorted[2].date).toBe("2024-03-16")
  })

  it("should return original array with no sorts", () => {
    const sorted = multiSort(shifts, [])
    expect(sorted).toEqual(shifts)
  })
})

describe("Date Range Helpers", () => {
  it("should return correct range for 'today'", () => {
    const [start, end] = getDateRange("today")
    const today = new Date().toISOString().split("T")[0]

    expect(start).toBe(today)
    expect(end).toBe(today)
  })

  it("should return correct range for 'yesterday'", () => {
    const [start, end] = getDateRange("yesterday")
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const expectedDate = yesterday.toISOString().split("T")[0]

    expect(start).toBe(expectedDate)
    expect(end).toBe(expectedDate)
  })

  it("should return correct range for 'last_7_days'", () => {
    const [start, end] = getDateRange("last_7_days")
    const today = new Date().toISOString().split("T")[0]
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    expect(end).toBe(today)
    expect(start).toBe(sevenDaysAgo.toISOString().split("T")[0])
  })

  it("should return correct range for 'last_30_days'", () => {
    const [, end] = getDateRange("last_30_days")
    const today = new Date().toISOString().split("T")[0]

    expect(end).toBe(today)
    // Start should be 30 days before end
  })
})

describe("Group By", () => {
  const shifts: Shift[] = [
    { id: "1", jobId: "job1", date: "2024-03-15", startTime: "09:00", endTime: "17:00", hours: 8, rateType: "weekday", breakMinutes: 0, earnings: 200 },
    { id: "2", jobId: "job2", date: "2024-03-15", startTime: "09:00", endTime: "15:00", hours: 6, rateType: "saturday", breakMinutes: 0, earnings: 210 },
    { id: "3", jobId: "job1", date: "2024-03-16", startTime: "09:00", endTime: "17:00", hours: 8, rateType: "sunday", breakMinutes: 0, earnings: 320 },
  ]

  it("should group by jobId", () => {
    const groups = groupBy(shifts, "jobId")

    expect(Object.keys(groups)).toHaveLength(2)
    expect(groups["job1"]).toHaveLength(2)
    expect(groups["job2"]).toHaveLength(1)
  })

  it("should group by date", () => {
    const groups = groupBy(shifts, "date")

    expect(Object.keys(groups)).toHaveLength(2)
    expect(groups["2024-03-15"]).toHaveLength(2)
    expect(groups["2024-03-16"]).toHaveLength(1)
  })
})

describe("Aggregate Functions", () => {
  const shifts: Shift[] = [
    { id: "1", jobId: "job1", date: "2024-03-15", startTime: "09:00", endTime: "17:00", hours: 8, rateType: "weekday", breakMinutes: 0, earnings: 200 },
    { id: "2", jobId: "job2", date: "2024-03-15", startTime: "09:00", endTime: "15:00", hours: 6, rateType: "saturday", breakMinutes: 0, earnings: 300 },
    { id: "3", jobId: "job1", date: "2024-03-16", startTime: "09:00", endTime: "17:00", hours: 8, rateType: "sunday", breakMinutes: 0, earnings: 400 },
  ]

  it("should calculate sum", () => {
    const stats = aggregate(shifts, "earnings")
    expect(stats.sum).toBe(900)
  })

  it("should calculate average", () => {
    const stats = aggregate(shifts, "earnings")
    expect(stats.avg).toBe(300)
  })

  it("should calculate min and max", () => {
    const stats = aggregate(shifts, "earnings")
    expect(stats.min).toBe(200)
    expect(stats.max).toBe(400)
  })

  it("should calculate count", () => {
    const stats = aggregate(shifts, "earnings")
    expect(stats.count).toBe(3)
  })

  it("should handle empty array", () => {
    const stats = aggregate([], "earnings")
    expect(stats.sum).toBe(0)
    expect(stats.avg).toBe(0)
    expect(stats.count).toBe(0)
  })
})

describe("Filter Presets", () => {
  beforeEach(() => {
    const store: Record<string, string> = {}
    globalThis.localStorage = {
      length: 0,
      key: (index: number) => Object.keys(store)[index] || null,
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        Object.keys(store).forEach(key => delete store[key])
      },
    }

    localStorage.clear()
  })

  it("should save filter preset", () => {
    const preset: FilterPreset = {
      id: "my-filter",
      name: "My Custom Filter",
      type: "shift",
      rules: [{ field: "earnings", operator: "greater_than", value: 200 }],
      createdAt: new Date().toISOString(),
    }

    saveFilterPreset(preset)
    const presets = getFilterPresets()

    const saved = presets.find(p => p.id === "my-filter")
    expect(saved).toBeDefined()
    expect(saved?.name).toBe("My Custom Filter")
  })

  it("should get default filter presets", () => {
    const presets = getFilterPresets()

    expect(presets.length).toBeGreaterThan(0)
    expect(presets.some(p => p.id === "high-earning-shifts")).toBe(true)
    expect(presets.some(p => p.id === "weekend-shifts")).toBe(true)
  })

  it("should update existing preset", () => {
    const preset: FilterPreset = {
      id: "my-filter",
      name: "My Custom Filter",
      type: "shift",
      rules: [{ field: "earnings", operator: "greater_than", value: 200 }],
      createdAt: new Date().toISOString(),
    }

    saveFilterPreset(preset)

    const updated = { ...preset, name: "Updated Filter" }
    saveFilterPreset(updated)

    const presets = getFilterPresets()
    const saved = presets.find(p => p.id === "my-filter")
    expect(saved?.name).toBe("Updated Filter")
  })

  it("should delete custom filter preset", () => {
    const preset: FilterPreset = {
      id: "my-filter",
      name: "My Custom Filter",
      type: "shift",
      rules: [{ field: "earnings", operator: "greater_than", value: 200 }],
      createdAt: new Date().toISOString(),
    }

    saveFilterPreset(preset)
    deleteFilterPreset("my-filter")

    const presets = getFilterPresets()
    const deleted = presets.find(p => p.id === "my-filter")
    expect(deleted).toBeUndefined()
  })

  it("should not delete default presets", () => {
    deleteFilterPreset("high-earning-shifts")

    const presets = getFilterPresets()
    const defaultPreset = presets.find(p => p.id === "high-earning-shifts")
    expect(defaultPreset).toBeDefined()
  })
})
