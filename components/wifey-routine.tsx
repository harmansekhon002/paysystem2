"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpenCheck,
  Brain,
  Droplets,
  Dumbbell,
  GraduationCap,
  Heart,
  LifeBuoy,
  MoonStar,
  PawPrint,
  Smile,
} from "lucide-react"
import { useAppData } from "@/components/data-provider"
import { useIsMobile } from "@/hooks/use-mobile"
import { useZonedDateKey } from "@/hooks/use-zoned-date-key"
import { triggerSpecialCelebration } from "@/lib/special-features"
import {
  clampHydrationGoal,
  computeLoveStreaksFromHistory,
  getHydrationStreakTarget,
  getLowMoodStreak,
  type CompanionMoodEntry,
  type LoveStreakStats,
  type RoutineHistorySnapshot,
} from "@/lib/notifications"
import { resolveTimeZone } from "@/lib/timezone"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type RoutineState = {
  waterBottles: number
  sleepHours: number
  exerciseDone: boolean
  paathDone: boolean
  studyDone: boolean
}

type CarePlan = {
  mode: "recovery" | "balance" | "growth"
  title: string
  summary: string
  steps: string[]
}

type WeeklyRecoveryInsights = {
  averageSleep: number
  averageHydration: number
  synergyDays: number
  recommendation: string
  focus: string
}

type SharedCheckInState = {
  harmanMood: string
  energy: string
}

const ROUTINE_HISTORY_KEY = "shiftwise:wifey-routine-history"
const MOOD_HISTORY_KEY = "shiftwise:wifey-mood-history"
const ENV_WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_HARMAN_WHATSAPP_NUMBER || "").replace(/\D/g, "")
const WATER_GOAL_OPTIONS = [4, 5, 6, 7, 8, 9, 10, 11, 12]

const DEFAULT_ROUTINE_STATE: RoutineState = {
  waterBottles: 0,
  sleepHours: 0,
  exerciseDone: false,
  paathDone: false,
  studyDone: false,
}

const MOOD_OPTIONS = [
  { value: "happy", label: "Happy" },
  { value: "calm", label: "Calm" },
  { value: "excited", label: "Excited" },
  { value: "focused", label: "Focused" },
  { value: "tired", label: "Tired" },
  { value: "stressed", label: "Stressed" },
  { value: "sad", label: "Sad" },
]

const ENERGY_OPTIONS = [
  { value: "low", label: "Low energy" },
  { value: "medium", label: "Medium energy" },
  { value: "high", label: "High energy" },
]

const SUPPORT_TEMPLATES = [
  {
    id: "general",
    label: "General support",
    body: "I need support right now. Please check in with me.",
  },
  {
    id: "overwhelmed",
    label: "Feeling overwhelmed",
    body: "I feel overwhelmed right now. Please help me reset gently.",
  },
  {
    id: "reassurance",
    label: "Need reassurance",
    body: "I need reassurance and a calm check-in from you right now.",
  },
]

function parseRoutineHistory(raw: string | null): Record<string, RoutineHistorySnapshot> {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, RoutineHistorySnapshot>
  } catch {
    return {}
  }
}

function parseRoutineState(raw: string | null): RoutineState {
  if (!raw) return DEFAULT_ROUTINE_STATE
  try {
    const parsed = JSON.parse(raw) as Partial<RoutineState>
    const sleepHours = Number(parsed.sleepHours)
    return {
      waterBottles: Number(parsed.waterBottles ?? 0),
      sleepHours: Number.isFinite(sleepHours) ? Math.max(0, Math.min(14, sleepHours)) : 0,
      exerciseDone: Boolean(parsed.exerciseDone),
      paathDone: Boolean(parsed.paathDone),
      studyDone: Boolean(parsed.studyDone),
    }
  } catch {
    return DEFAULT_ROUTINE_STATE
  }
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function getMoodTone(mood: string) {
  const value = mood.toLowerCase().trim()
  if (["stressed", "sad", "tired"].includes(value)) {
    return "Care mode reminders are active: gentler nudges and support-first prompts."
  }
  if (["happy", "excited", "focused"].includes(value)) {
    return "Momentum mode reminders are active: stronger challenge nudges."
  }
  return "Balanced reminder mode is active."
}

function getCarePlan(params: {
  mood: string
  lowMoodStreak: number
  streaks: LoveStreakStats
  todayWorkloadHours: number
  next48WorkloadHours: number
  sleepHours: number
  waterBottles: number
  hydrationGoal: number
  hydrationStreakTarget: number
  todayDisciplineDone: boolean
}): CarePlan {
  const mood = params.mood.toLowerCase().trim()
  const lowMood = ["sad", "stressed", "tired"].includes(mood)
  const highMood = ["happy", "excited", "focused"].includes(mood)
  const heavyWorkload = params.todayWorkloadHours >= 8 || params.next48WorkloadHours >= 12

  if (lowMood || params.lowMoodStreak >= 2 || params.sleepHours < 6 || heavyWorkload) {
    return {
      mode: "recovery",
      title: "AI Care Plan: Recovery Mode",
      summary: "Today calls for reduced pressure and stability-first actions.",
      steps: [
        `Hydration reset: complete ${Math.max(1, params.hydrationGoal - params.waterBottles)} more bottles gradually.`,
        "Move gently for 10-20 minutes (walk/stretch).",
        "Do one short 20-minute study block, then pause and reassess.",
      ],
    }
  }

  if (
    highMood &&
    (params.streaks.allHabits >= 3 || params.todayDisciplineDone) &&
    params.waterBottles >= params.hydrationGoal &&
    params.sleepHours >= 7 &&
    params.todayWorkloadHours <= 8
  ) {
    return {
      mode: "growth",
      title: "AI Care Plan: Growth Mode",
      summary: "Energy and consistency are high. This is a strong performance day.",
      steps: [
        `Target ${params.hydrationGoal}+ hydration bottles and close the day with a clean routine sweep.`,
        "Push a focused 45-60 minute deep study block.",
        "Use momentum for one optional stretch goal in couple dashboard.",
      ],
    }
  }

  return {
    mode: "balance",
    title: "AI Care Plan: Balanced Mode",
    summary: "Keep steady execution without overloading today.",
    steps: [
      `Keep hydration at ${params.hydrationStreakTarget}-${params.hydrationGoal} bottles through the day.`,
      "Complete exercise, paath, and study with moderate intensity.",
      "Sleep target: 7+ hours to protect tomorrow’s energy.",
    ],
  }
}

function computeWeeklyRecoveryInsights(
  history: Record<string, RoutineHistorySnapshot>,
  hydrationStreakTarget: number
): WeeklyRecoveryInsights {
  const recentDates = Object.keys(history)
    .filter(isIsoDate)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 7)

  if (recentDates.length === 0) {
    return {
      averageSleep: 0,
      averageHydration: 0,
      synergyDays: 0,
      recommendation: "Start logging sleep and hydration daily to unlock weekly insights.",
      focus: "Data collection",
    }
  }

  const entries = recentDates.map((date) => history[date])
  const averageSleep = entries.reduce((sum, entry) => sum + (entry.sleepHours ?? 0), 0) / entries.length
  const averageHydration = entries.reduce((sum, entry) => sum + (entry.waterBottles ?? 0), 0) / entries.length
  const lowHydrationThreshold = Math.max(2, hydrationStreakTarget - 1)
  const synergyDays = entries.filter((entry) => (entry.sleepHours ?? 0) >= 7 && (entry.waterBottles ?? 0) >= hydrationStreakTarget).length

  if (averageSleep < 6.5 && averageHydration < lowHydrationThreshold) {
    return {
      averageSleep,
      averageHydration,
      synergyDays,
      recommendation: "Low sleep + low hydration is dragging recovery. Prioritize 7h sleep and 2 bottles before noon.",
      focus: "Recovery reset",
    }
  }

  if (averageSleep < 6.5) {
    return {
      averageSleep,
      averageHydration,
      synergyDays,
      recommendation: "Hydration is decent but sleep debt is high. Move bedtime earlier by 30 minutes this week.",
      focus: "Sleep repair",
    }
  }

  if (averageHydration < lowHydrationThreshold) {
    return {
      averageSleep,
      averageHydration,
      synergyDays,
      recommendation: "Sleep is stable but hydration is low. Add a water trigger after every meal.",
      focus: "Hydration lift",
    }
  }

  return {
    averageSleep,
    averageHydration,
    synergyDays,
    recommendation: "Great baseline. Keep the habit stack and push for 4+ synergy days per week.",
    focus: "Consistency",
  }
}

export function WifeyRoutine() {
  const { isSpecialUser, displayName, data, updateSpecialCompanion } = useAppData()
  const isMobile = useIsMobile()
  const loveModeActive = isSpecialUser && data.settings.specialCompanion.loveThemeEnabled
  const parentalMode = !isSpecialUser
  const routineEnabled = isSpecialUser ? loveModeActive : true
  const router = useRouter()

  const resetTimeZone = resolveTimeZone(data.settings.timeZone)
  const today = useZonedDateKey(resetTimeZone)
  const routineStorageKey = `shiftwise:wifey-routine:${today}`
  const moodStorageKey = `shiftwise:wifey-mood:${today}`
  const coupleCheckInStorageKey = `shiftwise:couple-checkin:${today}`
  const hydrationGoal = clampHydrationGoal(data.settings.specialCompanion.waterBottleGoal)
  const hydrationStreakTarget = getHydrationStreakTarget(hydrationGoal)
  const whatsappNumber = isSpecialUser
    ? (data.settings.whatsappNumber || ENV_WHATSAPP_NUMBER || "").replace(/\D/g, "")
    : ""

  const [routine, setRoutine] = useState<RoutineState>(DEFAULT_ROUTINE_STATE)
  const [mood, setMood] = useState("")
  const [moodNote, setMoodNote] = useState("")
  const [moodHistory, setMoodHistory] = useState<CompanionMoodEntry[]>([])
  const [routineHistory, setRoutineHistory] = useState<Record<string, RoutineHistorySnapshot>>({})
  const [sharedCheckIn, setSharedCheckIn] = useState<SharedCheckInState>({ harmanMood: "", energy: "" })
  const [sleepDraft, setSleepDraft] = useState("")
  const [sleepFeedback, setSleepFeedback] = useState("")
  const [supportState, setSupportState] = useState("")

  useEffect(() => {
    if (isSpecialUser && !loveModeActive) {
      router.replace("/")
    }
  }, [isSpecialUser, loveModeActive, router])

  useEffect(() => {
    if (typeof window === "undefined" || !isSpecialUser) return

    try {
      const loadedRoutine = parseRoutineState(localStorage.getItem(routineStorageKey))
      setRoutine(loadedRoutine)
      setSleepDraft(loadedRoutine.sleepHours > 0 ? String(loadedRoutine.sleepHours) : "")
      setSleepFeedback(loadedRoutine.sleepHours > 0 ? `Saved: ${loadedRoutine.sleepHours}h` : "")

      const currentMoodRaw = localStorage.getItem(moodStorageKey)
      if (currentMoodRaw) {
        const parsed = JSON.parse(currentMoodRaw) as CompanionMoodEntry
        setMood(parsed.mood)
        setMoodNote(parsed.note ?? "")
      }

      const moodHistoryRaw = localStorage.getItem(MOOD_HISTORY_KEY)
      if (moodHistoryRaw) {
        const parsed = JSON.parse(moodHistoryRaw) as CompanionMoodEntry[]
        setMoodHistory(parsed)
      }

      const sharedCheckInRaw = localStorage.getItem(coupleCheckInStorageKey)
      if (sharedCheckInRaw) {
        const parsed = JSON.parse(sharedCheckInRaw) as { harmanMood?: string; energy?: string }
        setSharedCheckIn({
          harmanMood: parsed.harmanMood ?? "",
          energy: parsed.energy ?? "",
        })
      }

      const history = parseRoutineHistory(localStorage.getItem(ROUTINE_HISTORY_KEY))
      setRoutineHistory(history)
    } catch {
      // Ignore malformed local storage values.
    }
  }, [coupleCheckInStorageKey, isSpecialUser, moodStorageKey, routineStorageKey])

  const streaks = useMemo(
    () => computeLoveStreaksFromHistory(routineHistory, hydrationStreakTarget),
    [hydrationStreakTarget, routineHistory]
  )

  const weeklyInsights = useMemo(
    () => computeWeeklyRecoveryInsights(routineHistory, hydrationStreakTarget),
    [hydrationStreakTarget, routineHistory]
  )

  const lowMoodStreak = useMemo(() => getLowMoodStreak(moodHistory), [moodHistory])

  const todayWorkloadHours = useMemo(
    () => data.shifts.filter((shift) => shift.date === today).reduce((sum, shift) => sum + shift.hours, 0),
    [data.shifts, today]
  )

  const next48WorkloadHours = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + 2)
    const cutoffDate = cutoff.toISOString().split("T")[0]

    return data.shifts
      .filter((shift) => shift.date >= today && shift.date <= cutoffDate)
      .reduce((sum, shift) => sum + shift.hours, 0)
  }, [data.shifts, today])

  const carePlan = useMemo(
    () =>
      getCarePlan({
        mood,
        lowMoodStreak,
        streaks,
        todayWorkloadHours,
        next48WorkloadHours,
        sleepHours: routine.sleepHours,
        waterBottles: routine.waterBottles,
        hydrationGoal,
        hydrationStreakTarget,
        todayDisciplineDone: Boolean(routine.exerciseDone && routine.paathDone && routine.studyDone),
      }),
    [
      hydrationGoal,
      hydrationStreakTarget,
      lowMoodStreak,
      mood,
      next48WorkloadHours,
      routine.exerciseDone,
      routine.paathDone,
      routine.sleepHours,
      routine.studyDone,
      routine.waterBottles,
      streaks,
      todayWorkloadHours,
    ]
  )

  const persistRoutine = (next: RoutineState) => {
    setRoutine(next)

    try {
      localStorage.setItem(routineStorageKey, JSON.stringify(next))

      const history = parseRoutineHistory(localStorage.getItem(ROUTINE_HISTORY_KEY))
      const nextHistory: Record<string, RoutineHistorySnapshot> = {
        ...history,
        [today]: next,
      }
      localStorage.setItem(ROUTINE_HISTORY_KEY, JSON.stringify(nextHistory))
      setRoutineHistory(nextHistory)

      const previousStreaks = computeLoveStreaksFromHistory(history, hydrationStreakTarget)
      const nextStreaks = computeLoveStreaksFromHistory(nextHistory, hydrationStreakTarget)

      if (previousStreaks.hydration < 3 && nextStreaks.hydration >= 3) {
        triggerSpecialCelebration("Hydration streak unlocked")
      }
      if (previousStreaks.discipline < 3 && nextStreaks.discipline >= 3) {
        triggerSpecialCelebration("Discipline streak unlocked")
      }
      if (previousStreaks.allHabits < 3 && nextStreaks.allHabits >= 3) {
        triggerSpecialCelebration("All-habits streak unlocked")
      }
    } catch {
      // Ignore local storage failures.
    }
  }

  const toggleRoutineFlag = (key: keyof Omit<RoutineState, "waterBottles" | "sleepHours">, label: string) => {
    const markedDone = !routine[key]
    const next = { ...routine, [key]: markedDone }
    persistRoutine(next)
    triggerSpecialCelebration(markedDone ? `${label} marked done` : `${label} marked not done`)
  }

  const addWaterBottle = () => {
    const next = { ...routine, waterBottles: Math.min(hydrationGoal, routine.waterBottles + 1) }
    persistRoutine(next)
    triggerSpecialCelebration("Hydration check complete")
  }

  const updateWaterGoal = (value: string) => {
    const nextGoal = clampHydrationGoal(Number(value))
    updateSpecialCompanion({ waterBottleGoal: nextGoal })
    triggerSpecialCelebration(`Water goal set to ${nextGoal}`)
  }

  const saveSleepHours = () => {
    const value = Number(sleepDraft)
    if (!Number.isFinite(value) || value < 0 || value > 14) {
      setSleepFeedback("Enter a valid value between 0 and 14 hours.")
      return
    }

    const next = { ...routine, sleepHours: Math.round(value * 10) / 10 }
    persistRoutine(next)
    setSleepFeedback(`Saved: ${next.sleepHours}h`)
    triggerSpecialCelebration("Sleep logged")
  }

  const saveMood = () => {
    if (!mood) return

    const entry: CompanionMoodEntry = {
      date: today,
      mood,
      note: moodNote.trim(),
      savedAt: new Date().toISOString(),
    }

    try {
      localStorage.setItem(moodStorageKey, JSON.stringify(entry))

      const nextHistory = [entry, ...moodHistory.filter((item) => item.date !== today)].slice(0, 14)
      localStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(nextHistory))
      setMoodHistory(nextHistory)

      localStorage.setItem(
        coupleCheckInStorageKey,
        JSON.stringify({
          partnerMood: mood,
          harmanMood: sharedCheckIn.harmanMood,
          energy: sharedCheckIn.energy,
          note: moodNote.trim(),
          updatedAt: entry.savedAt,
        })
      )

      if (getLowMoodStreak(nextHistory) >= 2) {
        triggerSpecialCelebration("Care mode activated")
      } else {
        triggerSpecialCelebration("Mood logged")
      }
    } catch {
      // Ignore local storage failures.
    }
  }

  const sendSupportPing = async (template?: { label: string; body: string }) => {
    const recipientLabel = parentalMode ? "parent" : "Harman"
    const message = [
      template ? `Support request: ${template.label}` : "Support request",
      template?.body ?? "I need support right now.",
      `Mood: ${mood || "Not logged yet"}`,
      `Sleep: ${routine.sleepHours || 0}h`,
      `Hydration: ${routine.waterBottles}/${hydrationGoal}`,
      `Time: ${new Date().toLocaleString()}`,
    ].join("\n")

    if (typeof window !== "undefined" && whatsappNumber) {
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
      window.open(url, "_blank", "noopener,noreferrer")
      setSupportState(`Opening WhatsApp support message to ${recipientLabel}...`)
      triggerSpecialCelebration("Support ping sent")
      return
    }

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "Support Ping",
          text: message,
        })
        setSupportState("Support ping shared.")
        triggerSpecialCelebration("Support ping sent")
        return
      } catch {
        // Continue fallback flow when share is cancelled/unavailable.
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(message)
        setSupportState(`Support message copied. Paste and send to ${recipientLabel}.`)
        triggerSpecialCelebration("Support message copied")
        return
      } catch {
        // Fallback below.
      }
    }

    setSupportState("Could not auto-send. Copy this manually: " + message)
  }

  if (!routineEnabled) return null

  const completionCount = [routine.exerciseDone, routine.paathDone, routine.studyDone].filter(Boolean).length
  const hydrationRatio = Math.min(1, routine.waterBottles / hydrationGoal)
  const completionPercent = Math.round(((completionCount + hydrationRatio) / 4) * 100)

  return (
    <div className="mobile-page flex flex-col gap-6">
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-accent/35">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Heart className="size-6 text-primary" />
                {parentalMode ? "Student Routine" : `${displayName}'s Daily Routine`}
              </CardTitle>
              <CardDescription className="mt-1">
                {parentalMode
                  ? isMobile
                    ? "Hydration, study, and support in one place."
                    : "Track hydration, exercise, paath, and study with guardian support."
                  : isMobile
                    ? "Hydration, routine, and support for today."
                    : `Hydration, exercise, paath, and study${isSpecialUser && data.settings.specialCompanion.lovesPuppies ? " with hubby motivation." : "."}`}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1">{completionPercent}% complete today</Badge>
          </div>
        </CardHeader>
      </Card>

      {!isMobile ? (
        <div className="space-y-1 md:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Top priorities</p>
          <p className="text-sm text-muted-foreground">Track today&apos;s routine first. Insights and extras are moved below.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
          Today first: support, essentials, then care insights.
        </div>
      )}

      <Card className="border-primary/25">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LifeBuoy className="size-4 text-primary" />
            {parentalMode ? (isMobile ? "Parent Help" : "Parent Support + Emergency") : (isMobile ? "Support" : "Partner Reassurance + Emergency")}
          </CardTitle>
          {!isMobile ? (
            <CardDescription>
              {parentalMode
                ? "One place for parent support requests and urgent help templates."
                : "One place for support ping plus urgent reassurance templates."}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {!isMobile ? <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick support</p> : null}
            <Button onClick={() => void sendSupportPing()} className="w-full sm:w-fit">
              {isMobile ? "Request support" : parentalMode ? "Need parent support now" : "I need support now"}
            </Button>
          </div>

          {!isMobile ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emergency templates</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUPPORT_TEMPLATES
                  .filter((template) => template.id !== "general")
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => void sendSupportPing(template)}
                    >
                      {template.label}
                    </Button>
                  ))}
              </div>
            </div>
          ) : (
            <details className="rounded-md border border-border/60 px-3 py-2">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Emergency templates
              </summary>
              <div className="mt-2 grid gap-2">
                {SUPPORT_TEMPLATES
                  .filter((template) => template.id !== "general")
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => void sendSupportPing(template)}
                    >
                      {template.label}
                    </Button>
                  ))}
              </div>
            </details>
          )}

          {supportState && !isMobile ? <p className="text-xs text-muted-foreground">{supportState}</p> : null}
          {isSpecialUser && !whatsappNumber && !isMobile ? (
            <p className="text-[11px] text-muted-foreground">
              Tip: add guardian WhatsApp number in Settings for direct one-tap send.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpenCheck className="size-4 text-primary" />
              Today Essentials
            </CardTitle>
            <CardDescription>Water, sleep, and checklist in one card.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-lg border border-border/70 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Water</p>
                <p className="text-xs text-muted-foreground">{routine.waterBottles}/{hydrationGoal}</p>
              </div>
              <Progress value={Math.min(100, (routine.waterBottles / hydrationGoal) * 100)} />
              <Button onClick={addWaterBottle} className="w-full">Add water bottle</Button>
            </div>

            <div className="space-y-2 rounded-lg border border-border/70 p-3">
              <p className="text-sm font-medium">Sleep</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={14}
                  step={0.5}
                  value={sleepDraft}
                  onChange={(event) => setSleepDraft(event.target.value)}
                  placeholder="7.5"
                />
                <Button onClick={saveSleepHours} size="sm" className="shrink-0">Save</Button>
              </div>
              {sleepFeedback ? <p className="text-[11px] text-muted-foreground">{sleepFeedback}</p> : null}
            </div>

            <div className="grid gap-2">
              <Button
                variant={routine.exerciseDone ? "default" : "outline"}
                className="w-full justify-between"
                onClick={() => toggleRoutineFlag("exerciseDone", "Exercise")}
              >
                <span>Exercise</span>
                <span className="text-xs">{routine.exerciseDone ? "Done" : "Pending"}</span>
              </Button>
              <Button
                variant={routine.paathDone ? "default" : "outline"}
                className="w-full justify-between"
                onClick={() => toggleRoutineFlag("paathDone", "Paath")}
              >
                <span>Paath</span>
                <span className="text-xs">{routine.paathDone ? "Done" : "Pending"}</span>
              </Button>
              <Button
                variant={routine.studyDone ? "default" : "outline"}
                className="w-full justify-between"
                onClick={() => toggleRoutineFlag("studyDone", "Study")}
              >
                <span>Study</span>
                <span className="text-xs">{routine.studyDone ? "Done" : "Pending"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Droplets className="size-4 text-cyan-500" />
              Water Reminder
            </CardTitle>
            <CardDescription>{isMobile ? `Target: ${hydrationGoal} bottles.` : `Target: ${hydrationGoal} bottles today. Every hour, one sip check.`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSpecialUser ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Daily target</p>
                <Select value={String(hydrationGoal)} onValueChange={updateWaterGoal}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WATER_GOAL_OPTIONS.map((goal) => (
                      <SelectItem key={goal} value={String(goal)}>
                        {goal} bottles
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="rounded-md border border-border/70 bg-secondary/35 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Daily target</p>
                <p className="mt-1 text-sm text-foreground">{hydrationGoal} bottles</p>
                {!isMobile ? <p className="mt-1 text-[11px] text-muted-foreground">Edit this in Settings to keep one source of truth.</p> : null}
              </div>
            )}
            <Progress value={Math.min(100, (routine.waterBottles / hydrationGoal) * 100)} />
            <p className="text-sm text-muted-foreground">{routine.waterBottles}/{hydrationGoal} bottles done</p>
            <Button onClick={addWaterBottle} className="w-full">Add water bottle</Button>
          </CardContent>
        </Card>

        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MoonStar className="size-4 text-indigo-500" />
              Sleep Hours
            </CardTitle>
            <CardDescription>{isMobile ? "Log sleep." : "Log last night&apos;s sleep for recovery tracking."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="number"
              min={0}
              max={14}
              step={0.5}
              value={sleepDraft}
              onChange={(event) => setSleepDraft(event.target.value)}
              placeholder="e.g. 7.5"
            />
            <Button onClick={saveSleepHours} className="w-full">Save sleep</Button>
            {sleepFeedback ? <p className="text-xs text-muted-foreground">{sleepFeedback}</p> : null}
          </CardContent>
        </Card>

        <Card className="hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpenCheck className="size-4 text-primary" />
              Daily Checklist
            </CardTitle>
            <CardDescription>{isMobile ? "Mark routine tasks." : "Mark exercise, paath, and study from one compact card."}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button
              variant={routine.exerciseDone ? "default" : "outline"}
              className="w-full justify-between"
              onClick={() => toggleRoutineFlag("exerciseDone", "Exercise")}
            >
              <span>Exercise</span>
              <span className="text-xs">{routine.exerciseDone ? "Done" : "Pending"}</span>
            </Button>
            <Button
              variant={routine.paathDone ? "default" : "outline"}
              className="w-full justify-between"
              onClick={() => toggleRoutineFlag("paathDone", "Paath")}
            >
              <span>Paath</span>
              <span className="text-xs">{routine.paathDone ? "Done" : "Pending"}</span>
            </Button>
            <Button
              variant={routine.studyDone ? "default" : "outline"}
              className="w-full justify-between"
              onClick={() => toggleRoutineFlag("studyDone", "Study")}
            >
              <span>Study</span>
              <span className="text-xs">{routine.studyDone ? "Done" : "Pending"}</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="size-4 text-emerald-500" />
              Exercise
            </CardTitle>
            <CardDescription>Mark once your workout is done.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant={routine.exerciseDone ? "default" : "outline"} className="w-full" onClick={() => toggleRoutineFlag("exerciseDone", "Exercise")}>
              {routine.exerciseDone ? "Done" : "Mark done"}
            </Button>
          </CardContent>
        </Card>

        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpenCheck className="size-4 text-amber-500" />
              Paath
            </CardTitle>
            <CardDescription>Take a mindful spiritual moment daily.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant={routine.paathDone ? "default" : "outline"} className="w-full" onClick={() => toggleRoutineFlag("paathDone", "Paath")}>
              {routine.paathDone ? "Done" : "Mark done"}
            </Button>
          </CardContent>
        </Card>

        <Card className="hidden md:block md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="size-4 text-indigo-500" />
              Study
            </CardTitle>
            <CardDescription>Stay consistent and track your study streak.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant={routine.studyDone ? "default" : "outline"} className="w-full" onClick={() => toggleRoutineFlag("studyDone", "Study")}>
              {routine.studyDone ? "Done" : "Mark done"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <details className="rounded-xl border border-primary/25 bg-card md:hidden">
        <summary className="cursor-pointer list-none px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Brain className="size-4 text-primary" />
            AI Care Plan Of The Day
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Open for today&apos;s key step.</p>
        </summary>
        <div className="space-y-3 border-t border-border/60 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Workload today: {todayWorkloadHours.toFixed(1)}h
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            {carePlan.steps.slice(0, 1).map((step) => (
              <p key={step} className="rounded-md border border-border/60 px-3 py-2">
                {step}
              </p>
            ))}
          </div>
        </div>
      </details>

      <Card className="hidden border-primary/25 md:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="size-4 text-primary" />
            AI Care Plan Of The Day
          </CardTitle>
          <CardDescription>{carePlan.summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{carePlan.title}</Badge>
            <Badge variant="outline">Workload today: {todayWorkloadHours.toFixed(1)}h</Badge>
            <Badge variant="outline">Next 48h: {next48WorkloadHours.toFixed(1)}h</Badge>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            {carePlan.steps.map((step) => (
              <p key={step} className="rounded-md border border-border/60 px-3 py-2">
                {step}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {!parentalMode ? (
        <>
          <details className="rounded-xl border border-primary/25 bg-card md:hidden">
            <summary className="cursor-pointer list-none px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Smile className="size-4 text-primary" />
                Mood Log
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Log mood in one tap.</p>
            </summary>
            <div className="space-y-3 border-t border-border/60 px-4 py-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Current mood</p>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger className="border-rose-300/60 bg-rose-50/70 text-rose-700 shadow-sm focus-visible:border-rose-400 focus-visible:ring-rose-300/60 dark:border-rose-400/40 dark:bg-rose-950/25 dark:text-rose-200 dark:focus-visible:ring-rose-400/40">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent className="border-rose-300/50 bg-gradient-to-b from-rose-50 to-pink-50 text-rose-800 dark:border-rose-400/40 dark:from-rose-950 dark:to-pink-950 dark:text-rose-100">
                    {MOOD_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="focus:bg-rose-100 focus:text-rose-900 data-[state=checked]:bg-rose-100/90 data-[state=checked]:text-rose-900 dark:focus:bg-rose-900/55 dark:focus:text-rose-100 dark:data-[state=checked]:bg-rose-900/60 dark:data-[state=checked]:text-rose-100"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={saveMood} disabled={!mood} className="w-full">Save mood</Button>
            </div>
          </details>

        <Card className="hidden border-primary/25 md:block">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smile className="size-4 text-primary" />
              Mood Log + Shared Check-in
            </CardTitle>
            <CardDescription>
              Merged check-in: your mood plus shared status for Couple Dashboard insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Current mood</p>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="border-rose-300/60 bg-rose-50/70 text-rose-700 shadow-sm focus-visible:border-rose-400 focus-visible:ring-rose-300/60 dark:border-rose-400/40 dark:bg-rose-950/25 dark:text-rose-200 dark:focus-visible:ring-rose-400/40">
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent className="border-rose-300/50 bg-gradient-to-b from-rose-50 to-pink-50 text-rose-800 dark:border-rose-400/40 dark:from-rose-950 dark:to-pink-950 dark:text-rose-100">
                  {MOOD_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="focus:bg-rose-100 focus:text-rose-900 data-[state=checked]:bg-rose-100/90 data-[state=checked]:text-rose-900 dark:focus:bg-rose-900/55 dark:focus:text-rose-100 dark:data-[state=checked]:bg-rose-900/60 dark:data-[state=checked]:text-rose-100"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Harman mood</p>
                <Select
                  value={sharedCheckIn.harmanMood}
                  onValueChange={(value) => setSharedCheckIn((prev) => ({ ...prev, harmanMood: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOOD_OPTIONS.map((option) => (
                      <SelectItem key={`harman-${option.value}`} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Shared energy</p>
                <Select
                  value={sharedCheckIn.energy}
                  onValueChange={(value) => setSharedCheckIn((prev) => ({ ...prev, energy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select energy" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENERGY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Quick note</p>
              <Textarea
                value={moodNote}
                onChange={(event) => setMoodNote(event.target.value)}
                placeholder="What made you feel this way today?"
                rows={3}
              />
            </div>
            <Button onClick={saveMood} disabled={!mood}>Save mood</Button>

            {mood ? <p className="text-xs text-muted-foreground">{getMoodTone(mood)}</p> : null}
            {lowMoodStreak >= 2 ? (
              <div className="rounded-md border border-rose-300/50 bg-rose-500/5 px-3 py-2 text-xs text-muted-foreground">
                Care mode active: low mood streak is {lowMoodStreak} days. Prompts are gentler and support-first.
              </div>
            ) : null}

            {moodHistory.length > 0 ? (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent mood timeline</p>
                <div className="grid gap-2">
                  {moodHistory.slice(0, 4).map((entry) => (
                    <div key={entry.date} className="rounded-md border border-border/70 px-3 py-2 text-xs">
                      <p className="font-medium capitalize text-foreground">{entry.mood}</p>
                      <p className="text-muted-foreground">{entry.note || "No note added"}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/80">{entry.savedAt ? new Date(entry.savedAt).toLocaleString() : entry.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
        </>
      ) : null}

      <div className="hidden space-y-1 pt-1 md:block">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Progress and extras</p>
        <p className="text-sm text-muted-foreground">Longer-term trends and support tools are grouped below.</p>
      </div>

      <Card className="hidden border-primary/25 md:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MoonStar className="size-4 text-primary" />
            Sleep + Hydration Weekly Insights
          </CardTitle>
          <CardDescription>Correlation check with weekly recommendations.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 p-3">
            <p className="text-xs text-muted-foreground">Avg sleep</p>
            <p className="text-xl font-semibold text-foreground">{weeklyInsights.averageSleep.toFixed(1)}h</p>
          </div>
          <div className="rounded-lg border border-border/70 p-3">
            <p className="text-xs text-muted-foreground">Avg hydration</p>
            <p className="text-xl font-semibold text-foreground">{weeklyInsights.averageHydration.toFixed(1)} bottles</p>
          </div>
          <div className="rounded-lg border border-border/70 p-3">
            <p className="text-xs text-muted-foreground">Synergy days</p>
            <p className="text-xl font-semibold text-foreground">{weeklyInsights.synergyDays}/7</p>
          </div>
          <div className="rounded-lg border border-border/70 p-3 sm:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Focus: {weeklyInsights.focus}</p>
            <p className="mt-1 text-sm text-muted-foreground">{weeklyInsights.recommendation}</p>
          </div>
        </CardContent>
      </Card>

      {isSpecialUser && data.settings.specialCompanion.lovesPuppies && !isMobile ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-rose-300/50 bg-rose-500/5 p-4 text-sm text-muted-foreground">
          <PawPrint className="size-4 text-rose-500" />
          Love note: Proud of your discipline. Keep going, wifey.
        </div>
      ) : null}
    </div>
  )
}
