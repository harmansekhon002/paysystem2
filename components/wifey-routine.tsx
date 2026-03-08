"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, PawPrint } from "lucide-react"
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
} from "@/lib/notifications"
import { resolveTimeZone } from "@/lib/timezone"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { RoutineEssentials } from "./routine/routine-essentials"
import { RoutineSupport } from "./routine/routine-support"
import { RoutineInsights } from "./routine/routine-insights"
import {
  DEFAULT_ROUTINE_STATE,
  parseRoutineHistory,
  parseRoutineState,
  getCarePlan,
  computeWeeklyRecoveryInsights,
  getMoodTone,
} from "./routine/routine-engine"
import { type RoutineState, type SharedCheckInState } from "./routine/routine-types"

const ROUTINE_HISTORY_KEY = "shiftwise:wifey-routine-history"
const MOOD_HISTORY_KEY = "shiftwise:wifey-mood-history"
const ENV_WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_HARMAN_WHATSAPP_NUMBER || "").replace(/\D/g, "")

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
  const whatsappNumber = (data.settings.whatsappNumber || ENV_WHATSAPP_NUMBER || "").replace(/\D/g, "")

  const [routine, setRoutine] = useState<RoutineState>(DEFAULT_ROUTINE_STATE)
  const [mood, setMood] = useState("")
  const [moodNote, setMoodNote] = useState("")
  const [moodHistory, setMoodHistory] = useState<CompanionMoodEntry[]>([])
  const [routineHistory, setRoutineHistory] = useState<Record<string, any>>({})
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
      // Ignore
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
      const nextHistory = { ...history, [today]: next }
      localStorage.setItem(ROUTINE_HISTORY_KEY, JSON.stringify(nextHistory))
      setRoutineHistory(nextHistory)

      const prevStreaks = computeLoveStreaksFromHistory(history, hydrationStreakTarget)
      const nextStreaks = computeLoveStreaksFromHistory(nextHistory, hydrationStreakTarget)

      if (prevStreaks.hydration < 3 && nextStreaks.hydration >= 3) triggerSpecialCelebration("Hydration streak unlocked")
      if (prevStreaks.discipline < 3 && nextStreaks.discipline >= 3) triggerSpecialCelebration("Discipline streak unlocked")
      if (prevStreaks.allHabits < 3 && nextStreaks.allHabits >= 3) triggerSpecialCelebration("All-habits streak unlocked")
    } catch {
      // Ignore
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
      triggerSpecialCelebration(getLowMoodStreak(nextHistory) >= 2 ? "Care mode activated" : "Mood logged")
    } catch {
      // Ignore
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
        await navigator.share({ title: "Support Ping", text: message })
        setSupportState("Support ping shared.")
        triggerSpecialCelebration("Support ping sent")
        return
      } catch {
        // Ignore
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(message)
        setSupportState(`Support message copied. Paste and send to ${recipientLabel}.`)
        triggerSpecialCelebration("Support message copied")
        return
      } catch {
        // Fallback
      }
    }
    setSupportState("Could not auto-send. Copy manually: " + message)
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
                  ? "Hydration, study, and support in one place."
                  : `Daily tracking and hubby motivation.`}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1">{completionPercent}% complete today</Badge>
          </div>
        </CardHeader>
      </Card>

      <RoutineSupport
        sendSupportPing={sendSupportPing}
        supportState={supportState}
        isMobile={isMobile}
        parentalMode={parentalMode}
        whatsappNumber={whatsappNumber}
        isSpecialUser={isSpecialUser}
      />

      <RoutineEssentials
        routine={routine}
        hydrationGoal={hydrationGoal}
        addWaterBottle={addWaterBottle}
        sleepDraft={sleepDraft}
        setSleepDraft={setSleepDraft}
        saveSleepHours={saveSleepHours}
        sleepFeedback={sleepFeedback}
        toggleRoutineFlag={toggleRoutineFlag}
        isMobile={isMobile}
        isSpecialUser={isSpecialUser}
        updateWaterGoal={updateWaterGoal}
      />

      <RoutineInsights
        mood={mood}
        setMood={setMood}
        moodNote={moodNote}
        setMoodNote={setMoodNote}
        saveMood={saveMood}
        carePlan={carePlan}
        weeklyInsights={weeklyInsights}
        sharedCheckIn={sharedCheckIn}
        setSharedCheckIn={setSharedCheckIn}
        isMobile={isMobile}
        displayName={displayName}
        parentalMode={parentalMode}
      />

      {isSpecialUser && data.settings.specialCompanion.lovesPuppies && !isMobile && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-rose-300/50 bg-rose-500/5 p-4 text-sm text-muted-foreground">
          <PawPrint className="size-4 text-rose-500" />
          Love note: Proud of your discipline. Keep going, wifey.
        </div>
      )}
    </div>
  )
}
