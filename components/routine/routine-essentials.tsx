"use client"

import { useState } from "react"
import { Droplets, MoonStar, BookOpenCheck, Plus, Trash2, GripVertical, Pencil, Check, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type RoutineState } from "./routine-types"

const WATER_GOAL_OPTIONS = [4, 5, 6, 7, 8, 9, 10, 11, 12]

// Custom trackers stored in localStorage
const TRACKERS_KEY = "shiftwise:custom-trackers"

interface CustomTracker {
    id: string
    label: string
    done: boolean
}

function loadTrackers(): CustomTracker[] {
    if (typeof window === "undefined") return defaultTrackers()
    try {
        const raw = localStorage.getItem(TRACKERS_KEY)
        if (raw) return JSON.parse(raw) as CustomTracker[]
    } catch { /* noop */ }
    return defaultTrackers()
}

function defaultTrackers(): CustomTracker[] {
    return [
        { id: "exercise", label: "Exercise", done: false },
        { id: "paath", label: "Paath", done: false },
        { id: "study", label: "Study", done: false },
    ]
}

function saveTrackers(trackers: CustomTracker[]) {
    if (typeof window === "undefined") return
    localStorage.setItem(TRACKERS_KEY, JSON.stringify(trackers))
}

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
    isMobile,
    isSpecialUser,
    updateWaterGoal,
}: RoutineEssentialsProps) {
    const [trackers, setTrackers] = useState<CustomTracker[]>(loadTrackers)
    const [newLabel, setNewLabel] = useState("")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingLabel, setEditingLabel] = useState("")

    const persist = (next: CustomTracker[]) => {
        setTrackers(next)
        saveTrackers(next)
    }

    const toggleTracker = (id: string) => {
        persist(trackers.map(t => t.id === id ? { ...t, done: !t.done } : t))
    }

    const addTracker = () => {
        const label = newLabel.trim()
        if (!label) return
        persist([...trackers, { id: `${Date.now()}`, label, done: false }])
        setNewLabel("")
    }

    const removeTracker = (id: string) => {
        persist(trackers.filter(t => t.id !== id))
    }

    const startEdit = (tracker: CustomTracker) => {
        setEditingId(tracker.id)
        setEditingLabel(tracker.label)
    }

    const saveEdit = () => {
        if (!editingId) return
        persist(trackers.map(t => t.id === editingId ? { ...t, label: editingLabel.trim() || t.label } : t))
        setEditingId(null)
        setEditingLabel("")
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Water card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Droplets className="size-4 text-cyan-500" />
                        Water Reminder
                    </CardTitle>
                    <CardDescription>Target: {hydrationGoal} bottles today.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isSpecialUser ? (
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Daily target</p>
                            <Select value={String(hydrationGoal)} onValueChange={updateWaterGoal}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {WATER_GOAL_OPTIONS.map((goal) => (
                                        <SelectItem key={goal} value={String(goal)}>{goal} bottles</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="rounded-md border border-border/70 bg-secondary/35 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Daily target</p>
                            <p className="mt-1 text-sm text-foreground">{hydrationGoal} bottles</p>
                            {!isMobile ? <p className="mt-1 text-[11px] text-muted-foreground">Edit this in Settings.</p> : null}
                        </div>
                    )}
                    <Progress value={Math.min(100, (routine.waterBottles / hydrationGoal) * 100)} />
                    <p className="text-sm text-muted-foreground">{routine.waterBottles}/{hydrationGoal} bottles done</p>
                    <Button onClick={addWaterBottle} className="w-full">Add water bottle</Button>
                </CardContent>
            </Card>

            {/* Sleep card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <MoonStar className="size-4 text-indigo-500" />
                        Sleep Hours
                    </CardTitle>
                    <CardDescription>Log last night&apos;s sleep for recovery tracking.</CardDescription>
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

            {/* Customizable Daily Checklist */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BookOpenCheck className="size-4 text-primary" />
                        Daily Checklist
                    </CardTitle>
                    <CardDescription>Your personal daily goals — tap to toggle, add or remove anytime.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-3">
                        {trackers.map((tracker) => (
                            <div key={tracker.id} className="flex items-center gap-1.5">
                                {editingId === tracker.id ? (
                                    <>
                                        <Input
                                            value={editingLabel}
                                            onChange={e => setEditingLabel(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && saveEdit()}
                                            className="h-9 flex-1 text-sm"
                                            autoFocus
                                        />
                                        <Button variant="ghost" size="icon" className="size-9 shrink-0 text-primary" onClick={saveEdit}><Check className="size-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="size-9 shrink-0" onClick={() => setEditingId(null)}><X className="size-3.5" /></Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant={tracker.done ? "default" : "outline"}
                                            className="flex-1 justify-between h-9 text-sm"
                                            onClick={() => toggleTracker(tracker.id)}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <GripVertical className="size-3 text-muted-foreground/50" />
                                                {tracker.label}
                                            </span>
                                            <span className="text-xs opacity-70">{tracker.done ? "Done" : "Pending"}</span>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="size-9 shrink-0 text-muted-foreground hover:text-primary" onClick={() => startEdit(tracker)}>
                                            <Pencil className="size-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="size-9 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeTracker(tracker.id)}>
                                            <Trash2 className="size-3" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add new tracker */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        <Input
                            placeholder="Add a tracker (e.g. Meditation, Reading…)"
                            value={newLabel}
                            onChange={e => setNewLabel(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addTracker()}
                            className="h-9 text-sm"
                        />
                        <Button onClick={addTracker} disabled={!newLabel.trim()} size="sm" className="shrink-0 gap-1.5">
                            <Plus className="size-3.5" />
                            Add
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
