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
import { useAppStore } from "@/lib/store/app-store"
import { get, set as setIDB } from "idb-keyval"
import { pack, unpack } from "msgpackr"

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

function mergeIncrementalData(local: AppData, remote: Partial<AppData>): AppData {
  const mergeList = (localList: any[], remoteList: any[]) => {
    if (!remoteList.length) return localList
    const list = [...localList]
    remoteList.forEach(ritem => {
      const idx = list.findIndex(litem => litem.id === ritem.id)
      if (idx > -1) {
        // Simple last-write-wins based on updatedAt if available
        const rTime = ritem.updatedAt ? new Date(ritem.updatedAt).getTime() : 0
        const lTime = list[idx].updatedAt ? new Date(list[idx].updatedAt).getTime() : 0
        if (rTime >= lTime) {
          list[idx] = ritem
        }
      } else {
        list.push(ritem)
      }
    })
    return list
  }

  return {
    ...local,
    jobs: mergeList(local.jobs, remote.jobs || []),
    shifts: mergeList(local.shifts, remote.shifts || []),
    expenses: mergeList(local.expenses, remote.expenses || []),
    goals: mergeList(local.goals, remote.goals || []),
    budgetCategories: mergeList(local.budgetCategories, remote.budgetCategories || []),
    attendanceEvents: mergeList(local.attendanceEvents, remote.attendanceEvents || []),
    settings: remote.settings ? { ...local.settings, ...remote.settings } : local.settings,
    publicHolidays: remote.publicHolidays ?? local.publicHolidays,
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
  const { data, setData, ...storeActions } = useAppStore()

  const [hydrated, setHydrated] = useState(false)
  const [storageReady, setStorageReady] = useState(false)
  const [storageKey, setStorageKey] = useState(`${STORAGE_KEY}:guest`)
  const [currentUser, setCurrentUser] = useState<SessionResponse["user"] | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(null)
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

    try {
      // Parallelize session and subscription fetching
      const [sessionRes, subStatusRes] = await Promise.all([
        fetch("/api/auth/session", { cache: "no-store" }).catch(() => null),
        fetch("/api/subscription/status", { cache: "no-store" }).catch(() => null)
      ])

      let sessionUser: SessionResponse["user"] | undefined

      // Handle Session
      if (sessionRes && sessionRes.ok) {
        const session = (await sessionRes.json()) as SessionResponse
        sessionUser = session.user ?? undefined
        setCurrentUser(sessionUser ?? null)
        setStorageKey(getStorageKey(sessionUser))
        setStorageReady(true)

        if (isAdminSession(sessionUser)) {
          setPlanTier("admin")
          // If admin, we don't necessarily need to check subscription status
          return
        }

        if (sessionUser?.isSpecialUser) {
          setPlanTier("lifetime")
          // If special user, subscription status is secondary
          return
        }
      } else {
        setCurrentUser(null)
        setStorageKey(getStorageKey(undefined))
        setStorageReady(true)
      }

      // Handle Subscription Status
      if (subStatusRes && subStatusRes.ok) {
        const payload = (await subStatusRes.json()) as SubscriptionStatusResponse
        const normalizedTier = normalizePlanTier(payload)
        setPlanTier(sessionUser?.isSpecialUser && normalizedTier === "free" ? "lifetime" : normalizedTier)
      } else {
        setPlanTier(sessionUser?.isSpecialUser ? "lifetime" : "free")
      }
    } catch (error) {
      console.error("Refresh plan error", error)
      setPlanTier("free")
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !storageReady) return
    setHydrated(false)

    async function hydrate() {
      try {
        const stored = await get<Partial<AppData>>(storageKey)
        let localParsed: Partial<AppData> | null = null
        if (stored) {
          if (isLegacyDemoSeed(stored)) {
            // Cleanup legacy
          } else {
            localParsed = stored
          }
        }

        const finishHydration = (finalData: AppData) => {
          setData(finalData)
          setHydrated(true)
        }

        // If user is logged in, try fetching from cloud
        if (!storageKey.includes("guest") && currentUser) {
          const url = lastSyncTimestamp ? `/api/sync?since=${lastSyncTimestamp}` : "/api/sync"
          try {
            const res = await fetch(url, {
              headers: { "Accept": "application/msgpack, application/json" }
            })
            const contentType = res.headers.get("content-type") || ""
            let json: any
            if (contentType.includes("application/msgpack")) {
              const buffer = await res.arrayBuffer()
              json = unpack(new Uint8Array(buffer))
            } else {
              json = await res.json()
            }

            if (json.data) {
              const current = localParsed ? mergeStoredData(localParsed) : defaultData
              const merged = mergeIncrementalData(current, json.data)
              await setIDB(storageKey, merged)
              setLastSyncTimestamp(new Date().toISOString())
              finishHydration(merged)
              return
            }
          } catch (e) {
            console.error("Cloud fetch failed", e)
          }
        }

        if (localParsed) {
          finishHydration(mergeStoredData(localParsed))
        } else {
          finishHydration(defaultData)
        }
      } catch (e) {
        console.error("Hydration error", e)
        setData(defaultData)
        setHydrated(true)
      }
    }

    void hydrate()
  }, [storageKey, storageReady, currentUser, setData])

  useEffect(() => {
    void refreshPlan()
  }, [refreshPlan, status])

  useEffect(() => {
    if (!hydrated || !storageReady || typeof window === "undefined") return

    const saveData = async () => {
      try {
        setSaveStatus("saving")
        await setIDB(storageKey, data)
        setLastSavedAt(new Date().toISOString())

        if (status === "authenticated" && !storageKey.includes("guest")) {
          // Cloud sync
          if (navigator.onLine) {
            try {
              const msgpackPayload = pack({ data })
              const res = await fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/msgpack" },
                body: msgpackPayload as any
              })
              if (!res.ok) throw new Error("Sync failed")
              localStorage.removeItem(`${storageKey}:pending-sync`)
            } catch (err) {
              localStorage.setItem(`${storageKey}:pending-sync`, "true")
            }
          } else {
            localStorage.setItem(`${storageKey}:pending-sync`, "true")
          }
        }

        setSaveStatus("saved")
      } catch {
        setSaveStatus("error")
      }
    }

    const timeout = setTimeout(saveData, 1500)
    return () => clearTimeout(timeout)
  }, [data, hydrated, storageKey, storageReady, status])

  // Handle reconnect event to flush pending sync
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleOnline = async () => {
      const isPending = localStorage.getItem(`${storageKey}:pending-sync`)
      if (isPending && status === "authenticated" && !storageKey.includes("guest")) {
        try {
          const stored = localStorage.getItem(storageKey)
          if (!stored) return
          const payload = JSON.parse(stored)

          const res = await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/msgpack" },
            body: pack({ data: payload }) as any
          })

          if (res.ok) {
            localStorage.removeItem(`${storageKey}:pending-sync`)
            toast({
              title: "Connection restored",
              description: "Your offline changes have been saved to the cloud."
            })
          }
        } catch {
          // Ignore, it will retry on next write or next online event
        }
      }
    }

    window.addEventListener("online", handleOnline)
    // Attempt sync immediately on mount if we're online and have pending changes
    if (navigator.onLine) {
      handleOnline()
    }

    return () => window.removeEventListener("online", handleOnline)
  }, [status, storageKey])

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

  useEffect(() => {
    if (isSpecialUser) return
    if (!data.settings.whatsappNumber) return

    setData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        whatsappNumber: "",
      },
    }))
  }, [data.settings.whatsappNumber, isSpecialUser])

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
    storeActions.addShift(shift)
    return true
  }, [isPremium, planName, usage.shiftsThisMonth, storeActions])

  const removeShift = storeActions.removeShift
  const updateShift = storeActions.updateShift
  const addJob = storeActions.addJob
  const updateJob = storeActions.updateJob
  const removeJob = storeActions.removeJob
  const addExpense = storeActions.addExpense
  const updateExpense = storeActions.updateExpense
  const removeExpense = storeActions.removeExpense
  const addAttendanceEvent = storeActions.addAttendanceEvent
  const removeAttendanceEvent = storeActions.removeAttendanceEvent
  const addBudgetCategory = storeActions.addBudgetCategory
  const updateBudgetCategory = storeActions.updateBudgetCategory
  const removeBudgetCategory = storeActions.removeBudgetCategory

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
    storeActions.addGoal(goal)
    return true
  }, [isPremium, planName, usage.activeGoals, storeActions])

  const updateGoal = storeActions.updateGoal
  const removeGoal = storeActions.removeGoal
  const updateSettings = storeActions.updateSettings
  const updateSpecialCompanion = storeActions.updateSpecialCompanion
  const addPublicHoliday = storeActions.addPublicHoliday
  const removePublicHoliday = storeActions.removePublicHoliday

  const jobsById = useMemo(() => {
    return new Map(data.jobs.map((job) => [job.id, job]))
  }, [data.jobs])

  const getJob = useCallback((id: string) => {
    return jobsById.get(id)
  }, [jobsById])

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
