// Advanced filtering utilities

export type FilterOperator = "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "between" | "in"

export interface FilterRule<T = unknown> {
  field: string
  operator: FilterOperator
  value: T
}

export interface FilterPreset {
  id: string
  name: string
  type: "shift" | "expense" | "goal"
  rules: FilterRule[]
  createdAt: string
}

// Smart filter presets
export const defaultFilterPresets: FilterPreset[] = [
  {
    id: "high-earning-shifts",
    name: "High Earning Shifts",
    type: "shift",
    rules: [{ field: "earnings", operator: "greater_than", value: 200 }],
    createdAt: new Date().toISOString(),
  },
  {
    id: "weekend-shifts",
    name: "Weekend Shifts",
    type: "shift",
    rules: [{ field: "rateType", operator: "in", value: ["saturday", "sunday"] }],
    createdAt: new Date().toISOString(),
  },
  {
    id: "recent-week",
    name: "Last 7 Days",
    type: "shift",
    rules: [
      {
        field: "date",
        operator: "between",
        value: [new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0], new Date().toISOString().split("T")[0]],
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "large-expenses",
    name: "Large Expenses",
    type: "expense",
    rules: [{ field: "amount", operator: "greater_than", value: 100 }],
    createdAt: new Date().toISOString(),
  },
  {
    id: "food-expenses",
    name: "Food & Groceries",
    type: "expense",
    rules: [{ field: "category", operator: "equals", value: "Food & Groceries" }],
    createdAt: new Date().toISOString(),
  },
  {
    id: "urgent-goals",
    name: "Urgent Goals",
    type: "goal",
    rules: [
      {
        field: "deadline",
        operator: "less_than",
        value: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      },
    ],
    createdAt: new Date().toISOString(),
  },
]

// Apply a single filter rule
function applyRule<T extends Record<string, unknown>>(item: T, rule: FilterRule): boolean {
  const value = item[rule.field]

  switch (rule.operator) {
    case "equals":
      return value === rule.value
    case "not_equals":
      return value !== rule.value
    case "greater_than":
      return Number(value) > Number(rule.value)
    case "less_than":
      return Number(value) < Number(rule.value)
    case "contains":
      return String(value).toLowerCase().includes(String(rule.value).toLowerCase())
    case "between":
      if (Array.isArray(rule.value) && rule.value.length === 2) {
        return value >= rule.value[0] && value <= rule.value[1]
      }
      return false
    case "in":
      return Array.isArray(rule.value) && rule.value.includes(value)
    default:
      return true
  }
}

// Apply multiple filter rules (AND logic)
export function applyFilters<T extends Record<string, unknown>>(items: T[], rules: FilterRule[]): T[] {
  if (rules.length === 0) return items

  return items.filter(item => rules.every(rule => applyRule(item, rule)))
}

// Save/load filter presets from localStorage
function readCustomPresets(): FilterPreset[] {
  const saved = localStorage.getItem("filter_presets")
  if (!saved) return []

  try {
    return JSON.parse(saved)
  } catch {
    return []
  }
}

export function saveFilterPreset(preset: FilterPreset): void {
  const saved = readCustomPresets()
  const existing = saved.findIndex(p => p.id === preset.id)

  if (existing >= 0) {
    saved[existing] = preset
  } else {
    saved.push(preset)
  }

  localStorage.setItem("filter_presets", JSON.stringify(saved))
}

export function getFilterPresets(): FilterPreset[] {
  return [...defaultFilterPresets, ...readCustomPresets()]
}

export function deleteFilterPreset(id: string): void {
  if (defaultFilterPresets.find(d => d.id === id)) return
  const saved = readCustomPresets().filter(p => p.id !== id)
  localStorage.setItem("filter_presets", JSON.stringify(saved))
}

// Smart search with fuzzy matching
export function fuzzySearch<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  fields: string[]
): T[] {
  if (!query.trim()) return items

  const lowerQuery = query.toLowerCase()
  const queryWords = lowerQuery.split(/\s+/)

  return items.filter(item => {
    const searchText = fields.map(field => String(item[field] || "").toLowerCase()).join(" ")

    // Exact match gets highest priority
    if (searchText.includes(lowerQuery)) return true

    // All words present
    return queryWords.every(word => searchText.includes(word))
  })
}

// Multi-field sorting
export type SortDirection = "asc" | "desc"

export interface SortConfig {
  field: string
  direction: SortDirection
}

export function multiSort<T extends Record<string, unknown>>(items: T[], sorts: SortConfig[]): T[] {
  if (sorts.length === 0) return items

  return [...items].sort((a, b) => {
    for (const sort of sorts) {
      const aVal = a[sort.field]
      const bVal = b[sort.field]

      let comparison = 0

      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal
      } else if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal)
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }

      if (comparison !== 0) {
        return sort.direction === "asc" ? comparison : -comparison
      }
    }

    return 0
  })
}

// Date range helpers
export function getDateRange(preset: string): [string, string] {
  const now = new Date()
  const today = now.toISOString().split("T")[0]

  switch (preset) {
    case "today":
      return [today, today]

    case "yesterday": {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const date = yesterday.toISOString().split("T")[0]
      return [date, date]
    }

    case "this_week": {
      const start = new Date(now)
      start.setDate(start.getDate() - start.getDay())
      return [start.toISOString().split("T")[0], today]
    }

    case "last_week": {
      const start = new Date(now)
      start.setDate(start.getDate() - start.getDay() - 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return [start.toISOString().split("T")[0], end.toISOString().split("T")[0]]
    }

    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return [start.toISOString().split("T")[0], today]
    }

    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return [start.toISOString().split("T")[0], end.toISOString().split("T")[0]]
    }

    case "this_year": {
      const start = new Date(now.getFullYear(), 0, 1)
      return [start.toISOString().split("T")[0], today]
    }

    case "last_7_days": {
      const start = new Date(now)
      start.setDate(start.getDate() - 7)
      return [start.toISOString().split("T")[0], today]
    }

    case "last_30_days": {
      const start = new Date(now)
      start.setDate(start.getDate() - 30)
      return [start.toISOString().split("T")[0], today]
    }

    case "last_90_days": {
      const start = new Date(now)
      start.setDate(start.getDate() - 90)
      return [start.toISOString().split("T")[0], today]
    }

    default:
      return [today, today]
  }
}

// Group items by field
export function groupBy<T extends Record<string, unknown>>(items: T[], field: string): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const key = String(item[field])
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

// Aggregate functions
export function aggregate<T extends Record<string, unknown>>(
  items: T[],
  field: string
): { sum: number; avg: number; min: number; max: number; count: number } {
  const values = items.map(item => Number(item[field])).filter(v => !isNaN(v))

  if (values.length === 0) {
    return { sum: 0, avg: 0, min: 0, max: 0, count: 0 }
  }

  return {
    sum: values.reduce((sum, v) => sum + v, 0),
    avg: values.reduce((sum, v) => sum + v, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
  }
}
