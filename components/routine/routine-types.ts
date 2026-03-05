import { type LoveStreakStats, type RoutineHistorySnapshot } from "@/lib/notifications"

export type RoutineState = {
    waterBottles: number
    sleepHours: number
    exerciseDone: boolean
    paathDone: boolean
    studyDone: boolean
}

export type CarePlan = {
    mode: "recovery" | "balance" | "growth"
    title: string
    summary: string
    steps: string[]
}

export type WeeklyRecoveryInsights = {
    averageSleep: number
    averageHydration: number
    synergyDays: number
    recommendation: string
    focus: string
}

export type SharedCheckInState = {
    harmanMood: string
    energy: string
}
