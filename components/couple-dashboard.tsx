"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, PiggyBank, Send, Sparkles, Trophy } from "lucide-react"
import { useAppData } from "@/components/data-provider"
import { useZonedDateKey } from "@/hooks/use-zoned-date-key"
import { triggerSpecialCelebration } from "@/lib/special-features"
import {
  clampHydrationGoal,
  computeLoveStreaksFromHistory,
  getHydrationStreakTarget,
  type CompanionMoodEntry,
  type RoutineHistorySnapshot,
} from "@/lib/notifications"
import { resolveTimeZone } from "@/lib/timezone"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/store"

type CoupleFund = {
  target: number
  current: number
}

type SharedCheckIn = {
  partnerMood: string
  harmanMood: string
  energy: string
  note: string
  updatedAt?: string
}

const DEFAULT_FUND: CoupleFund = {
  target: 500,
  current: 0,
}

const DEFAULT_SHARED_CHECKIN: SharedCheckIn = {
  partnerMood: "",
  harmanMood: "",
  energy: "",
  note: "",
}

const ROUTINE_HISTORY_KEY = "shiftwise:wifey-routine-history"
const ENV_WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_HARMAN_WHATSAPP_NUMBER || "").replace(/\D/g, "")

export function CoupleDashboard() {
  const { data, isSpecialUser, displayName } = useAppData()
  const loveModeActive = isSpecialUser && data.settings.specialCompanion.loveThemeEnabled
  const parentalMode = !isSpecialUser
  const dashboardEnabled = isSpecialUser ? loveModeActive : true
  const router = useRouter()
  const resetTimeZone = resolveTimeZone(data.settings.timeZone)
  const today = useZonedDateKey(resetTimeZone)
  const todayRoutineStorageKey = `shiftwise:wifey-routine:${today}`
  const todayMoodStorageKey = `shiftwise:wifey-mood:${today}`
  const todayCheckInStorageKey = `shiftwise:couple-checkin:${today}`
  const hydrationGoal = clampHydrationGoal(data.settings.specialCompanion.waterBottleGoal)
  const hydrationStreakTarget = getHydrationStreakTarget(hydrationGoal)
  const whatsappNumber = (data.settings.whatsappNumber || ENV_WHATSAPP_NUMBER || "").replace(/\D/g, "")

  const [fund, setFund] = useState<CoupleFund>(DEFAULT_FUND)
  const [addAmount, setAddAmount] = useState("50")
  const [targetAmount, setTargetAmount] = useState(String(DEFAULT_FUND.target))
  const [routineHistory, setRoutineHistory] = useState<Record<string, RoutineHistorySnapshot>>({})
  const [todayRoutine, setTodayRoutine] = useState<RoutineHistorySnapshot>({})
  const [todayMood, setTodayMood] = useState<CompanionMoodEntry | null>(null)
  const [checkIn, setCheckIn] = useState<SharedCheckIn>(DEFAULT_SHARED_CHECKIN)
  const [insightStatus, setInsightStatus] = useState("")

  useEffect(() => {
    if (isSpecialUser && !loveModeActive) {
      router.replace("/")
    }
  }, [isSpecialUser, loveModeActive, router])

  useEffect(() => {
    if (typeof window === "undefined" || (isSpecialUser && !loveModeActive)) return
    try {
      const raw = localStorage.getItem("shiftwise:couple-fund")
      if (!raw) return
      const parsed = JSON.parse(raw) as CoupleFund
      setFund(parsed)
    } catch {
      // Ignore malformed fund data.
    }
  }, [isSpecialUser, loveModeActive])

  useEffect(() => {
    if (typeof window === "undefined" || (isSpecialUser && !loveModeActive)) return

    try {
      const routineHistoryRaw = localStorage.getItem(ROUTINE_HISTORY_KEY)
      if (routineHistoryRaw) {
        setRoutineHistory(JSON.parse(routineHistoryRaw) as Record<string, RoutineHistorySnapshot>)
      } else {
        setRoutineHistory({})
      }

      const todayRoutineRaw = localStorage.getItem(todayRoutineStorageKey)
      if (todayRoutineRaw) {
        setTodayRoutine(JSON.parse(todayRoutineRaw) as RoutineHistorySnapshot)
      } else {
        setTodayRoutine({})
      }

      const todayMoodRaw = localStorage.getItem(todayMoodStorageKey)
      if (todayMoodRaw) {
        setTodayMood(JSON.parse(todayMoodRaw) as CompanionMoodEntry)
      } else {
        setTodayMood(null)
      }

      const checkInRaw = localStorage.getItem(todayCheckInStorageKey)
      if (checkInRaw) {
        setCheckIn(JSON.parse(checkInRaw) as SharedCheckIn)
      } else {
        setCheckIn(DEFAULT_SHARED_CHECKIN)
      }
    } catch {
      // Ignore malformed local storage entries.
    }
  }, [isSpecialUser, loveModeActive, todayCheckInStorageKey, todayMoodStorageKey, todayRoutineStorageKey])

  useEffect(() => {
    setTargetAmount(String(fund.target))
  }, [fund.target])

  const saveFund = (next: CoupleFund) => {
    setFund(next)
    try {
      localStorage.setItem("shiftwise:couple-fund", JSON.stringify(next))
    } catch {
      // Ignore local storage failures.
    }
  }

  const totalEarnings = useMemo(() => data.shifts.reduce((sum, shift) => sum + shift.earnings, 0), [data.shifts])
  const totalSavedGoals = useMemo(() => data.goals.reduce((sum, goal) => sum + goal.currentAmount, 0), [data.goals])
  const streaks = useMemo(
    () => computeLoveStreaksFromHistory(routineHistory, hydrationStreakTarget),
    [hydrationStreakTarget, routineHistory]
  )

  const addToFund = () => {
    const value = Number(addAmount)
    if (!Number.isFinite(value) || value <= 0) return

    const next = {
      ...fund,
      current: Math.min(fund.target, Math.round((fund.current + value) * 100) / 100),
    }
    saveFund(next)
    triggerSpecialCelebration("Couple fund updated")
  }

  const updateFundTarget = () => {
    const value = Number(targetAmount)
    if (!Number.isFinite(value) || value <= 0) return

    const nextTarget = Math.round(value * 100) / 100
    const next = {
      target: nextTarget,
      current: Math.min(fund.current, nextTarget),
    }
    saveFund(next)
    setTargetAmount(String(nextTarget))
    triggerSpecialCelebration("Fund target updated")
  }

  const sendWhatsAppMessage = async (message: string, onSuccess: (status: string) => void) => {
    if (typeof window !== "undefined" && whatsappNumber) {
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
      window.open(url, "_blank", "noopener,noreferrer")
      onSuccess("Opened WhatsApp with your message.")
      return true
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(message)
        onSuccess("WhatsApp number not configured. Message copied to clipboard.")
        return true
      } catch {
        onSuccess("Could not send or copy message.")
        return false
      }
    }

    onSuccess("Could not send message from this device.")
    return false
  }

  const sendTodayInsights = async () => {
    const todayExerciseDone = Boolean(todayRoutine.exerciseDone)
    const todayPaathDone = Boolean(todayRoutine.paathDone)
    const todayStudyDone = Boolean(todayRoutine.studyDone)
    const todayWater = Number(todayRoutine.waterBottles ?? 0)
    const todaySleep = Number(todayRoutine.sleepHours ?? 0)
    const formatLabel = (value?: string | null) =>
      value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "Not logged"

    const message = [
      `${parentalMode ? "Daily Student Insight" : "Daily Couple Insight"} - ${today}`,
      parentalMode ? "From Student Tracker" : "From Harman",
      "",
      "Health",
      `- Mood: ${formatLabel(todayMood?.mood)}`,
      `- Sleep: ${todaySleep > 0 ? `${todaySleep}h` : "Not logged"}`,
      `- Hydration: ${todayWater}/${hydrationGoal} bottles`,
      "",
      "Discipline",
      `- Exercise: ${todayExerciseDone ? "Done" : "Pending"}`,
      `- Paath: ${todayPaathDone ? "Done" : "Pending"}`,
      `- Study: ${todayStudyDone ? "Done" : "Pending"}`,
      `- Love streaks: hydration ${streaks.hydration}d, discipline ${streaks.discipline}d, all-habits ${streaks.allHabits}d`,
      "",
      parentalMode ? "Parent Check-in" : "Shared Check-in",
      `- ${parentalMode ? "Student mood" : "Partner mood"}: ${formatLabel(checkIn.partnerMood)}`,
      `- ${parentalMode ? "Parent mood" : "Harman mood"}: ${formatLabel(checkIn.harmanMood)}`,
      `- Shared energy: ${formatLabel(checkIn.energy)}`,
      checkIn.note ? `- Note: ${checkIn.note}` : "- Note: No note today",
      "",
      parentalMode ? "Auto summary from ShiftWise" : "Love, Harman",
    ].join("\n")

    await sendWhatsAppMessage(message, setInsightStatus)
    triggerSpecialCelebration("Today insights sent")
  }

  if (!dashboardEnabled) return null

  const progress = fund.target > 0 ? Math.min(100, Math.round((fund.current / fund.target) * 100)) : 0
  const todayHabitCount = [todayRoutine.exerciseDone, todayRoutine.paathDone, todayRoutine.studyDone].filter(Boolean).length
  const todaySleep = Number(todayRoutine.sleepHours ?? 0)
  const todayMoodLabel = todayMood?.mood
    ? `${todayMood.mood.charAt(0).toUpperCase()}${todayMood.mood.slice(1)}`
    : "Not logged"

  return (
    <div className="mobile-page flex flex-col gap-6">
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-accent/35">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Heart className="size-6 text-primary" />
                {parentalMode ? "Parent Dashboard" : "Couple Dashboard"}
              </CardTitle>
              <CardDescription>
                {parentalMode
                  ? "Parent view for student progress, routine insights, and support actions."
                  : `Shared progress and insights for ${displayName} and Harman.`}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {parentalMode ? "Parent mode" : "Together mode"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {parentalMode ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-primary" />
                Student Snapshot
              </CardTitle>
              <CardDescription>Merged daily status and streaks in one place.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">Mood</p>
                <p className="text-base font-semibold text-foreground">{todayMoodLabel}</p>
                <p className="text-[11px] text-muted-foreground">Sleep: {todaySleep > 0 ? `${todaySleep}h` : "Not logged"}</p>
              </div>
              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">Today habits</p>
                <p className="text-base font-semibold text-foreground">{todayHabitCount}/3 completed</p>
                <p className="text-[11px] text-muted-foreground">Hydration: {Number(todayRoutine.waterBottles ?? 0)}/{hydrationGoal}</p>
              </div>
              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">Hydration streak</p>
                <p className="text-base font-semibold text-foreground">{streaks.hydration} days</p>
                <p className="text-[11px] text-muted-foreground">Goal: {hydrationStreakTarget}+ bottles/day</p>
              </div>
              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">Discipline streak</p>
                <p className="text-base font-semibold text-foreground">{streaks.discipline} days</p>
                <p className="text-[11px] text-muted-foreground">All habits streak: {streaks.allHabits} days</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PiggyBank className="size-4 text-indigo-500" />
                Education Fund
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(fund.current, data.settings.currencySymbol)}</p>
              <p className="text-xs text-muted-foreground">
                Target {formatCurrency(fund.target, data.settings.currencySymbol)} · {progress}% complete
              </p>
              <div className="flex gap-2">
                <Input
                  value={addAmount}
                  onChange={(event) => setAddAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="Add amount"
                />
                <Button onClick={addToFund}>Add</Button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={targetAmount}
                  onChange={(event) => setTargetAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="Set target"
                />
                <Button variant="outline" onClick={updateFundTarget}>Set target</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-amber-500" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalEarnings, data.settings.currencySymbol)}</p>
              <p className="text-xs text-muted-foreground">All shifts logged in this account</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-4 text-emerald-500" />
                Goal Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSavedGoals, data.settings.currencySymbol)}</p>
              <p className="text-xs text-muted-foreground">Combined across all goals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PiggyBank className="size-4 text-indigo-500" />
                Date Night Fund
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(fund.current, data.settings.currencySymbol)}</p>
              <p className="text-xs text-muted-foreground">
                Target {formatCurrency(fund.target, data.settings.currencySymbol)} · {progress}% complete
              </p>
              <div className="flex gap-2">
                <Input
                  value={addAmount}
                  onChange={(event) => setAddAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="Add amount"
                />
                <Button onClick={addToFund}>Add</Button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={targetAmount}
                  onChange={(event) => setTargetAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="Set target"
                />
                <Button variant="outline" onClick={updateFundTarget}>Set target</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-primary/25">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="size-4 text-primary" />
              {parentalMode ? "One-click Student Insights" : "One-click Today Insights"}
            </CardTitle>
          <CardDescription>
            {parentalMode
              ? "Sends student routine and check-in summary to parent WhatsApp."
              : "Sends routine + merged mood/check-in details from Wifey Routine to WhatsApp."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={sendTodayInsights} className="w-full sm:w-fit">
            {parentalMode ? "Send student insights" : "Send today insights"}
          </Button>
          {insightStatus ? <p className="text-xs text-muted-foreground">{insightStatus}</p> : null}
          {!whatsappNumber ? (
            <p className="text-[11px] text-muted-foreground">
              {parentalMode
                ? "Tip: add parent WhatsApp number in Settings to open WhatsApp directly."
                : "Tip: add WhatsApp number in Settings to open WhatsApp directly."}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {!parentalMode ? (
        <Card className="border-primary/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Love Streaks
            </CardTitle>
            <CardDescription>Moved from routine: shared consistency view.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-xs text-muted-foreground">Hydration streak</p>
              <p className="text-xl font-semibold text-foreground">{streaks.hydration} days</p>
              <p className="text-[11px] text-muted-foreground">Goal: {hydrationStreakTarget}+ bottles/day</p>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-xs text-muted-foreground">Discipline streak</p>
              <p className="text-xl font-semibold text-foreground">{streaks.discipline} days</p>
              <p className="text-[11px] text-muted-foreground">Today: {todayHabitCount}/3 habits</p>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-xs text-muted-foreground">All-habits streak</p>
              <p className="text-xl font-semibold text-foreground">{streaks.allHabits} days</p>
              <p className="text-[11px] text-muted-foreground">Hydration + discipline together</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
