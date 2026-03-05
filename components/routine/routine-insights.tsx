"use client"

import { GraduationCap, Smile } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { type CarePlan, type WeeklyRecoveryInsights, type SharedCheckInState } from "./routine-types"

// Merged mood + energy options in a single combined selector
const MOOD_ENERGY_OPTIONS = [
    { value: "happy-high", label: "😄 Happy & Energised" },
    { value: "happy-low", label: "😊 Happy but Tired" },
    { value: "calm-medium", label: "😌 Calm & Steady" },
    { value: "excited-high", label: "🤩 Excited & High Energy" },
    { value: "focused-high", label: "🎯 Focused & Productive" },
    { value: "tired-low", label: "😴 Tired & Low Energy" },
    { value: "stressed-medium", label: "😰 Stressed" },
    { value: "sad-low", label: "😔 Sad & Drained" },
]

interface RoutineInsightsProps {
    mood: string
    setMood: (v: string) => void
    moodNote: string
    setMoodNote: (v: string) => void
    saveMood: () => void
    carePlan: CarePlan
    weeklyInsights: WeeklyRecoveryInsights
    sharedCheckIn: SharedCheckInState
    setSharedCheckIn: React.Dispatch<React.SetStateAction<SharedCheckInState>>
    isMobile: boolean
    displayName: string
    parentalMode: boolean
}

export function RoutineInsights({
    mood,
    setMood,
    moodNote,
    setMoodNote,
    saveMood,
    carePlan,
    weeklyInsights,
    sharedCheckIn,
    setSharedCheckIn,
    isMobile,
    parentalMode,
}: RoutineInsightsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Mood & Energy Check-in (merged) */}
            <Card className="border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Smile className="size-4 text-orange-500" />
                        {parentalMode ? "Self Check-in" : "Partner Check-in"}
                    </CardTitle>
                    {!isMobile ? (
                        <CardDescription>
                            How are you feeling right now?
                        </CardDescription>
                    ) : null}
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">My Mood & Energy</p>
                            <Select value={mood} onValueChange={setMood}>
                                <SelectTrigger>
                                    <SelectValue placeholder="How are you feeling + energy level?" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MOOD_ENERGY_OPTIONS.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {!parentalMode && (
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Hubby Mood & Energy</p>
                                <Select
                                    value={sharedCheckIn.harmanMood}
                                    onValueChange={(v) => setSharedCheckIn(prev => ({ ...prev, harmanMood: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Hubby's mood" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MOOD_ENERGY_OPTIONS.map((m) => (
                                            <SelectItem key={`hubby-${m.value}`} value={m.value}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Note</p>
                            <Textarea
                                placeholder="What made you feel this way today?"
                                className="h-20 resize-none text-sm"
                                value={moodNote}
                                onChange={(e) => setMoodNote(e.target.value)}
                            />
                        </div>

                        <Button onClick={saveMood} disabled={!mood} className="w-full">
                            Save check-in
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Care Plan (rule-based, no AI) */}
            <Card className={`border-primary/25 ${carePlan.mode === "recovery" ? "bg-red-500/5" : carePlan.mode === "growth" ? "bg-primary/5" : ""}`}>
                <CardHeader>
                    <CardTitle className="text-base">{carePlan.title}</CardTitle>
                    <CardDescription>{carePlan.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {carePlan.steps.map((step, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                <span className="flex-shrink-0 text-primary font-bold">•</span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {/* Weekly Insights */}
            <Card className="md:col-span-2 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <GraduationCap className="size-4 text-primary" />
                        Weekly Recovery Insights
                    </CardTitle>
                    <CardDescription>Based on your last 7 days of data.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-3">
                    <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avg Sleep</p>
                        <p className="text-2xl font-bold">{weeklyInsights.averageSleep.toFixed(1)}h</p>
                        <Progress value={(weeklyInsights.averageSleep / 8) * 100} className="h-1" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avg Hydration</p>
                        <p className="text-2xl font-bold">{weeklyInsights.averageHydration.toFixed(1)}</p>
                        <Progress value={(weeklyInsights.averageHydration / 8) * 100} className="h-1" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Perfect Days</p>
                        <p className="text-2xl font-bold">{weeklyInsights.synergyDays}</p>
                        <p className="text-[10px] text-muted-foreground">Sleep + Water synergy</p>
                    </div>
                    <div className="sm:col-span-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Focus: {weeklyInsights.focus}</p>
                        <p className="text-sm text-foreground/80">{weeklyInsights.recommendation}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
