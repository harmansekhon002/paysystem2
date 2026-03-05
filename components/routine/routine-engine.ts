import { type RoutineHistorySnapshot, type LoveStreakStats } from "@/lib/notifications"
import { type RoutineState, type CarePlan, type WeeklyRecoveryInsights } from "./routine-types"

export const DEFAULT_ROUTINE_STATE: RoutineState = {
    waterBottles: 0,
    sleepHours: 0,
    exerciseDone: false,
    paathDone: false,
    studyDone: false,
}

export function parseRoutineHistory(raw: string | null): Record<string, RoutineHistorySnapshot> {
    if (!raw) return {}
    try {
        return JSON.parse(raw) as Record<string, RoutineHistorySnapshot>
    } catch {
        return {}
    }
}

export function parseRoutineState(raw: string | null): RoutineState {
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

export function isIsoDate(value: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function getMoodTone(mood: string) {
    const value = mood.toLowerCase().trim()
    if (["stressed", "sad", "tired"].includes(value)) {
        return "Care mode reminders are active: gentler nudges and support-first prompts."
    }
    if (["happy", "excited", "focused"].includes(value)) {
        return "Momentum mode reminders are active: stronger challenge nudges."
    }
    return "Balanced reminder mode is active."
}

export function getCarePlan(params: {
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

export function computeWeeklyRecoveryInsights(
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
