"use client"

import { Droplets, MoonStar, BookOpenCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type RoutineState } from "./routine-types"

const WATER_GOAL_OPTIONS = [4, 5, 6, 7, 8, 9, 10, 11, 12]

interface RoutineEssentialsProps {
    routine: RoutineState
    hydrationGoal: number
    addWaterBottle: () => void
    sleepDraft: string
    setSleepDraft: (v: string) => void
    saveSleepHours: () => void
    sleepFeedback: string
    toggleRoutineFlag: (key: keyof Omit<RoutineState, "waterBottles" | "sleepHours">, label: string) => void
    isMobile: boolean
    isSpecialUser: boolean
    updateWaterGoal: (v: string) => void
}

export function RoutineEssentials({
    routine,
    hydrationGoal,
    addWaterBottle,
    sleepDraft,
    setSleepDraft,
    saveSleepHours,
    sleepFeedback,
    toggleRoutineFlag,
    isMobile,
    isSpecialUser,
    updateWaterGoal,
}: RoutineEssentialsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Mobile-only combined card */}
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

            {/* Desktop/Wide views */}
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

            {/* Desktop checklist */}
            <Card className="hidden md:block md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BookOpenCheck className="size-4 text-primary" />
                        Daily Checklist
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-2 sm:grid-cols-3">
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
        </div>
    )
}
