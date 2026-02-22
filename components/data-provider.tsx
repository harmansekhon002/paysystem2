"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import {
  type AppData, type Shift, type JobTemplate, type Expense, type Goal,
  type BudgetCategory, type AppSettings,
  defaultData, generateId, getJobColor
} from "@/lib/store"

type DataContextType = {
  data: AppData
  // Shifts
  addShift: (shift: Omit<Shift, "id">) => void
  removeShift: (id: string) => void
  updateShift: (id: string, shift: Partial<Shift>) => void
  // Jobs
  addJob: (job: Omit<JobTemplate, "id" | "color">) => string
  updateJob: (id: string, job: Partial<JobTemplate>) => void
  removeJob: (id: string) => void
  // Expenses
  addExpense: (expense: Omit<Expense, "id">) => void
  removeExpense: (id: string) => void
  // Budget
  addBudgetCategory: (cat: Omit<BudgetCategory, "id">) => void
  updateBudgetCategory: (id: string, cat: Partial<BudgetCategory>) => void
  removeBudgetCategory: (id: string) => void
  // Goals
  addGoal: (goal: Omit<Goal, "id">) => void
  updateGoal: (id: string, goal: Partial<Goal>) => void
  removeGoal: (id: string) => void
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void
  // Public holidays
  addPublicHoliday: (date: string) => void
  removePublicHoliday: (date: string) => void
  // Helpers
  getJob: (id: string) => JobTemplate | undefined
}

const DataContext = createContext<DataContextType | null>(null)

const STORAGE_KEY = "shiftwise:data:v1"

function mergeStoredData(raw: Partial<AppData>): AppData {
  return {
    ...defaultData,
    ...raw,
    jobs: raw.jobs ?? defaultData.jobs,
    shifts: raw.shifts ?? defaultData.shifts,
    expenses: raw.expenses ?? defaultData.expenses,
    budgetCategories: raw.budgetCategories ?? defaultData.budgetCategories,
    goals: raw.goals ?? defaultData.goals,
    settings: { ...defaultData.settings, ...raw.settings },
    publicHolidays: raw.publicHolidays ?? defaultData.publicHolidays,
  }
}

export function useAppData() {
  const context = useContext(DataContext)
  if (!context) throw new Error("useAppData must be used within DataProvider")
  return context
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppData>
        setData(mergeStoredData(parsed))
      }
    } catch {
      // Ignore corrupted storage and use defaults.
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data, hydrated])

  // Shifts
  const addShift = useCallback((shift: Omit<Shift, "id">) => {
    setData(prev => ({ ...prev, shifts: [...prev.shifts, { ...shift, id: generateId() }] }))
  }, [])

  const removeShift = useCallback((id: string) => {
    setData(prev => ({ ...prev, shifts: prev.shifts.filter(s => s.id !== id) }))
  }, [])

  const updateShift = useCallback((id: string, updates: Partial<Shift>) => {
    setData(prev => ({
      ...prev,
      shifts: prev.shifts.map(s => s.id === id ? { ...s, ...updates } : s),
    }))
  }, [])

  // Jobs
  const addJob = useCallback((job: Omit<JobTemplate, "id" | "color">) => {
    const id = generateId()
    setData(prev => ({
      ...prev,
      jobs: [...prev.jobs, { ...job, id, color: getJobColor(prev.jobs.length) }],
    }))
    return id
  }, [])

  const updateJob = useCallback((id: string, updates: Partial<JobTemplate>) => {
    setData(prev => ({
      ...prev,
      jobs: prev.jobs.map(j => j.id === id ? { ...j, ...updates } : j),
    }))
  }, [])

  const removeJob = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      jobs: prev.jobs.filter(j => j.id !== id),
      shifts: prev.shifts.filter(s => s.jobId !== id),
    }))
  }, [])

  // Expenses
  const addExpense = useCallback((expense: Omit<Expense, "id">) => {
    setData(prev => ({ ...prev, expenses: [...prev.expenses, { ...expense, id: generateId() }] }))
  }, [])

  const removeExpense = useCallback((id: string) => {
    setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }))
  }, [])

  // Budget
  const addBudgetCategory = useCallback((cat: Omit<BudgetCategory, "id">) => {
    setData(prev => ({
      ...prev,
      budgetCategories: [...prev.budgetCategories, { ...cat, id: generateId() }],
    }))
  }, [])

  const updateBudgetCategory = useCallback((id: string, updates: Partial<BudgetCategory>) => {
    setData(prev => ({
      ...prev,
      budgetCategories: prev.budgetCategories.map(c => c.id === id ? { ...c, ...updates } : c),
    }))
  }, [])

  const removeBudgetCategory = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      budgetCategories: prev.budgetCategories.filter(c => c.id !== id),
    }))
  }, [])

  // Goals
  const addGoal = useCallback((goal: Omit<Goal, "id">) => {
    setData(prev => ({ ...prev, goals: [...prev.goals, { ...goal, id: generateId() }] }))
  }, [])

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g),
    }))
  }, [])

  const removeGoal = useCallback((id: string) => {
    setData(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }))
  }, [])

  // Settings
  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    setData(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }))
  }, [])

  // Public holidays
  const addPublicHoliday = useCallback((date: string) => {
    setData(prev => ({
      ...prev,
      publicHolidays: [...prev.publicHolidays, date],
    }))
  }, [])

  const removePublicHoliday = useCallback((date: string) => {
    setData(prev => ({
      ...prev,
      publicHolidays: prev.publicHolidays.filter(d => d !== date),
    }))
  }, [])

  // Helpers
  const getJob = useCallback((id: string) => {
    return data.jobs.find(j => j.id === id)
  }, [data.jobs])

  return (
    <DataContext.Provider
      value={{
        data,
        addShift, removeShift, updateShift,
        addJob, updateJob, removeJob,
        addExpense, removeExpense,
        addBudgetCategory, updateBudgetCategory, removeBudgetCategory,
        addGoal, updateGoal, removeGoal,
        updateSettings,
        addPublicHoliday, removePublicHoliday,
        getJob,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
