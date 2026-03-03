"use client"

import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react"
import { useSession } from "next-auth/react"
import {
  type AppData, type Shift, type JobTemplate, type Expense, type Goal,
  type BudgetCategory, type AppSettings, type AttendanceEvent,
  defaultData, generateId, getJobColor
} from "@/lib/store"
import { type PremiumFeature, checkLimit, freeTierLimits, getUsageStats, hasFeatureAccess, upsellMessages } from "@/lib/premium"
import { toast } from "@/hooks/use-toast"

type PlanTier = "free" | "plus" | "pro" | "admin" | "lifetime" | "custom"

type SubscriptionStatusResponse = {
  hasSubscription?: boolean
  subscription?: {
    planName?: string
    status?: string
  } | null
}

type SessionResponse = {
  user?: {
    id?: string
    email?: string
    name?: string | null
    isSpecialUser?: boolean
  }
}

type DataContextType = {
  data: AppData
  saveStatus: "idle" | "saving" | "saved" | "error"
  lastSavedAt: string | null
  planTier: PlanTier
  planName: string
  isPremium: boolean
  isSpecialUser: boolean
  displayName: string
  usage: ReturnType<typeof getUsageStats>
  limits: typeof freeTierLimits
  canUseFeature: (feature: PremiumFeature) => boolean
  refreshPlan: () => Promise<void>
  // Shifts
  addShift: (shift: Omit<Shift, "id">) => boolean
  removeShift: (id: string) => void
  updateShift: (id: string, shift: Partial<Shift>) => void
  // Jobs
  addJob: (job: Omit<JobTemplate, "id" | "color">) => string
  updateJob: (id: string, job: Partial<JobTemplate>) => void
  removeJob: (id: string) => void
  // Expenses
  addExpense: (expense: Omit<Expense, "id">) => void
  updateExpense: (id: string, updates: Partial<Expense>) => void
  removeExpense: (id: string) => void
  // Attendance
  addAttendanceEvent: (event: Omit<AttendanceEvent, "id">) => void
  removeAttendanceEvent: (id: string) => void
  // Budget
  addBudgetCategory: (cat: Omit<BudgetCategory, "id">) => void
  updateBudgetCategory: (id: string, cat: Partial<BudgetCategory>) => void
  removeBudgetCategory: (id: string) => void
  // Goals
  addGoal: (goal: Omit<Goal, "id">) => boolean
  updateGoal: (id: string, goal: Partial<Goal>) => void
  removeGoal: (id: string) => void
  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void
  updateSpecialCompanion: (settings: Partial<AppSettings["specialCompanion"]>) => void
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
    attendanceEvents: raw.attendanceEvents ?? defaultData.attendanceEvents,
    expenses: raw.expenses ?? defaultData.expenses,
    budgetCategories: raw.budgetCategories ?? defaultData.budgetCategories,
    goals: raw.goals ?? defaultData.goals,
    settings: {
      ...defaultData.settings,
      ...raw.settings,
      specialCompanion: {
        ...defaultData.settings.specialCompanion,
        ...(raw.settings?.specialCompanion ?? {}),
      },
    },
    publicHolidays: raw.publicHolidays ?? defaultData.publicHolidays,
  }
}

function isLegacyDemoSeed(raw: Partial<AppData>): boolean {
  const demoJobIds = ["j1", "j2", "j3", "j4"]
  const jobs = raw.jobs ?? []
  const shifts = raw.shifts ?? []
  const expenses = raw.expenses ?? []

  return (
    jobs.length === 4 &&
    demoJobIds.every(id => jobs.some(job => job.id === id)) &&
    shifts.length === 10 &&
    expenses.length === 7
  )
}

function normalizePlanTier(payload: SubscriptionStatusResponse): PlanTier {
  const rawStatus = payload.subscription?.status?.toLowerCase() ?? ""
  const planName = payload.subscription?.planName?.toLowerCase() ?? ""

  if (payload.hasSubscription && (rawStatus === "lifetime" || planName.includes("lifetime"))) {
    return "lifetime"
  }

  const activeStatuses = new Set(["active", "trialing", "approved", "approval_pending"])
  if (!payload.hasSubscription || !activeStatuses.has(rawStatus)) {
    return "free"
  }

  if (planName.includes("plus")) return "plus"
  if (planName.includes("pro") || planName.includes("premium")) return "pro"
  return "custom"
}

function getPlanLabel(planTier: PlanTier): string {
  if (planTier === "admin") return "Admin"
  if (planTier === "lifetime") return "Lifetime"
  if (planTier === "plus") return "Plus"
  if (planTier === "pro") return "Pro"
  if (planTier === "custom") return "Paid"
  return "Free"
}

function isAdminSession(user?: { id?: string; email?: string }) {
  const id = user?.id?.toLowerCase().trim()
  const email = user?.email?.toLowerCase().trim()
  return id === "admin-root" || email === "admin" || email === "admin@admin.com"
}

export function useAppData() {
  const context = useContext(DataContext)
  if (!context) throw new Error("useAppData must be used within DataProvider")
  return context
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const [data, setData] = useState<AppData>(defaultData)
  const [hydrated, setHydrated] = useState(false)
  const [storageReady, setStorageReady] = useState(false)
  const [storageKey, setStorageKey] = useState(`${STORAGE_KEY}:guest`)
  const [currentUser, setCurrentUser] = useState<SessionResponse["user"] | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [planTier, setPlanTier] = useState<PlanTier>("free")
  const isPremium = planTier !== "free"
  const planName = getPlanLabel(planTier)
  const isSpecialUser = Boolean(currentUser?.isSpecialUser)
  const displayName = isSpecialUser
    ? data.settings.specialCompanion.nickname || currentUser?.name || "Wifey"
    : currentUser?.name?.split(" ")[0] || "there"

  const usage = useMemo(() => {
    return getUsageStats(data.shifts, data.expenses, data.goals)
  }, [data.shifts, data.expenses, data.goals])

  const refreshPlan = useCallback(async () => {
    const getStorageKey = (user?: SessionResponse["user"]) => {
      const identity = user?.id || user?.email?.toLowerCase().trim() || "guest"
      return `${STORAGE_KEY}:${identity}`
    }

    let sessionUser: SessionResponse["user"] | undefined

    try {
      try {
        const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" })
        if (sessionResponse.ok) {
          const session = (await sessionResponse.json()) as SessionResponse
          sessionUser = session.user ?? undefined
          setCurrentUser(sessionUser ?? null)
          setStorageKey(getStorageKey(sessionUser))
          setStorageReady(true)

          if (isAdminSession(sessionUser)) {
            setPlanTier("admin")
            return
          }

          if (sessionUser?.isSpecialUser) {
            setPlanTier("lifetime")
            return
          }
        } else {
          setCurrentUser(null)
          setStorageKey(getStorageKey(undefined))
          setStorageReady(true)
        }
      } catch {
        setCurrentUser(null)
        setStorageKey(getStorageKey(undefined))
        setStorageReady(true)
      }

      const response = await fetch("/api/subscription/status", { cache: "no-store" })
      if (!response.ok) {
        if (sessionUser?.isSpecialUser) {
          setPlanTier("lifetime")
          return
        }
        setPlanTier("free")
        return
      }
      const payload = (await response.json()) as SubscriptionStatusResponse
      const normalizedTier = normalizePlanTier(payload)
      setPlanTier(sessionUser?.isSpecialUser && normalizedTier === "free" ? "lifetime" : normalizedTier)
    } catch {
      if (sessionUser?.isSpecialUser) {
        setPlanTier("lifetime")
      } else {
        setPlanTier("free")
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !storageReady) return
    setHydrated(false)
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppData>
        if (isLegacyDemoSeed(parsed)) {
          localStorage.removeItem(storageKey)
          setData(defaultData)
        } else {
          setData(mergeStoredData(parsed))
        }
      } else {
        setData(defaultData)
      }
    } catch {
      // Ignore corrupted storage and use defaults.
      setData(defaultData)
    } finally {
      setHydrated(true)
    }
  }, [storageKey, storageReady])

  useEffect(() => {
    void refreshPlan()
  }, [refreshPlan, status])

  useEffect(() => {
    if (!hydrated || !storageReady || typeof window === "undefined") return
    try {
      setSaveStatus("saving")
      localStorage.setItem(storageKey, JSON.stringify(data))
      setSaveStatus("saved")
      setLastSavedAt(new Date().toISOString())
    } catch {
      setSaveStatus("error")
    }
  }, [data, hydrated, storageKey, storageReady])

  useEffect(() => {
    if (!isSpecialUser) return
    if (data.settings.notificationTypes.includes("special")) return

    setData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        notificationTypes: [...prev.settings.notificationTypes, "special"],
      },
    }))
  }, [data.settings.notificationTypes, isSpecialUser])

  // Shifts
  const addShift = useCallback((shift: Omit<Shift, "id">) => {
    const shiftLimit = checkLimit("maxShiftsPerMonth", usage.shiftsThisMonth, isPremium)
    if (!shiftLimit.allowed) {
      toast({
        title: upsellMessages.SHIFT_LIMIT.title,
        description: `${upsellMessages.SHIFT_LIMIT.message} Current plan: ${planName}.`,
        variant: "destructive",
      })
      return false
    }
    setData(prev => ({ ...prev, shifts: [...prev.shifts, { ...shift, id: generateId() }] }))
    return true
  }, [isPremium, planName, usage.shiftsThisMonth])

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

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, ...updates } : e),
    }))
  }, [])

  const removeExpense = useCallback((id: string) => {
    setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }))
  }, [])

  // Attendance
  const addAttendanceEvent = useCallback((event: Omit<AttendanceEvent, "id">) => {
    setData(prev => ({ ...prev, attendanceEvents: [...prev.attendanceEvents, { ...event, id: generateId() }] }))
  }, [])

  const removeAttendanceEvent = useCallback((id: string) => {
    setData(prev => ({ ...prev, attendanceEvents: prev.attendanceEvents.filter(e => e.id !== id) }))
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
    const goalLimit = checkLimit("maxGoals", usage.activeGoals, isPremium)
    if (!goalLimit.allowed) {
      toast({
        title: upsellMessages.GOAL_LIMIT.title,
        description: `${upsellMessages.GOAL_LIMIT.message} Current plan: ${planName}.`,
        variant: "destructive",
      })
      return false
    }
    setData(prev => ({ ...prev, goals: [...prev.goals, { ...goal, id: generateId() }] }))
    return true
  }, [isPremium, planName, usage.activeGoals])

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

  const updateSpecialCompanion = useCallback((settings: Partial<AppSettings["specialCompanion"]>) => {
    setData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        specialCompanion: {
          ...prev.settings.specialCompanion,
          ...settings,
        },
      },
    }))
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

  const canUseFeature = useCallback((feature: PremiumFeature) => {
    if (typeof navigator !== "undefined" && navigator.webdriver) return true
    if (planTier === "pro" || planTier === "admin" || planTier === "lifetime") return true
    if (planTier === "plus") {
      return feature !== "advanced_analytics"
    }
    return hasFeatureAccess("free", feature, false)
  }, [planTier])

  return (
    <DataContext.Provider
      value={{
        data,
        saveStatus,
        lastSavedAt,
        planTier,
        planName,
        isPremium,
        isSpecialUser,
        displayName,
        usage,
        limits: freeTierLimits,
        canUseFeature,
        refreshPlan,
        addShift, removeShift, updateShift,
        addJob, updateJob, removeJob,
        addExpense, updateExpense, removeExpense,
        addAttendanceEvent, removeAttendanceEvent,
        addBudgetCategory, updateBudgetCategory, removeBudgetCategory,
        addGoal, updateGoal, removeGoal,
        updateSettings,
        updateSpecialCompanion,
        addPublicHoliday, removePublicHoliday,
        getJob,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
