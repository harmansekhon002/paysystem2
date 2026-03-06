"use client"

import { useState, useEffect } from "react"
import { DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
    calculateShiftHours, calculateShiftEarnings, detectRateType,
    formatCurrency, RATE_TYPE_LABELS, type RateType, type PenaltyRates, type JobTemplate, type Shift
} from "@/lib/store"
import { trackEvent } from "@/lib/analytics"
import { hapticFeedback } from "@/lib/utils"

interface ShiftDialogsProps {
    jobs: JobTemplate[]
    shifts: Shift[]
    publicHolidays: string[]
    currencySymbol: string
    currencyStr: string
    addShift: (shift: Omit<Shift, "id">) => boolean
    updateShift: (id: string, shift: Partial<Shift>) => void
    addJob: (job: Omit<JobTemplate, "id" | "color">) => string
    getJob: (id: string) => JobTemplate | undefined
    // Dialog State
    dialogOpen: boolean
    setDialogOpen: (open: boolean) => void
    jobDialogOpen: boolean
    setJobDialogOpen: (open: boolean) => void
    recurringDialogOpen: boolean
    setRecurringDialogOpen: (open: boolean) => void
    editDialogOpen: boolean
    setEditDialogOpen: (open: boolean) => void
    editShiftId: string | null
    setEditShiftId: (id: string | null) => void
}

const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
}

const hasOverlap = (shifts: Shift[], date: string, startTime: string, endTime: string, ignoreShiftId?: string | null) => {
    const start = toMinutes(startTime)
    let end = toMinutes(endTime)

    if (end <= start) {
        end += 24 * 60
    }

    return shifts.some((shift) => {
        if (shift.id === ignoreShiftId) return false
        if (shift.date !== date) return false
        const shiftStart = toMinutes(shift.startTime)
        let shiftEnd = toMinutes(shift.endTime)
        if (shiftEnd <= shiftStart) {
            shiftEnd += 24 * 60
        }
        return start < shiftEnd && shiftStart < end
    })
}

const makeRates = (base: number): PenaltyRates => ({
    weekday: base,
    saturday: base,
    sunday: base,
    public_holiday: base,
    overtime: base,
})

export function ShiftDialogs({
    jobs,
    shifts,
    publicHolidays,
    currencySymbol,
    currencyStr,
    addShift,
    updateShift,
    addJob,
    getJob,
    dialogOpen,
    setDialogOpen,
    jobDialogOpen,
    setJobDialogOpen,
    recurringDialogOpen,
    setRecurringDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    editShiftId,
    setEditShiftId,
}: ShiftDialogsProps) {
    const { toast } = useToast()
    const todayStr = new Date().toISOString().split("T")[0]

    // Add Form State
    const [form, setForm] = useState(() => ({
        date: todayStr,
        startTime: "09:00",
        endTime: "15:00",
        jobId: jobs[0]?.id || "",
        rateType: detectRateType(todayStr, publicHolidays) as RateType,
        breakMinutes: 30,
        note: "",
    }))

    const handleDateChange = (date: string) => {
        const detected = detectRateType(date, publicHolidays)
        setForm(f => ({ ...f, date, rateType: detected }))
    }

    const previewHours = calculateShiftHours(form.startTime, form.endTime, form.breakMinutes)
    const previewJob = getJob(form.jobId)
    const previewEarnings = previewJob ? calculateShiftEarnings(previewHours, previewJob, form.rateType) : 0

    const handleAdd = () => {
        if (!form.jobId) return
        hapticFeedback(15)
        if (hasOverlap(shifts, form.date, form.startTime, form.endTime)) {
            toast({ title: "Shift overlaps with an existing shift", description: "Adjust start/end times.", variant: "destructive" })
            return
        }
        const job = getJob(form.jobId)
        if (!job) return
        const wasAdded = addShift({
            date: form.date,
            startTime: form.startTime,
            endTime: form.endTime,
            jobId: form.jobId,
            rateType: form.rateType,
            breakMinutes: form.breakMinutes,
            hours: previewHours,
            earnings: previewEarnings,
            note: form.note || undefined,
        })
        if (!wasAdded) return
        trackEvent("shift_added", { hours: previewHours, earnings: previewEarnings, rateType: form.rateType })
        toast({ title: "Shift logged", description: `${formatCurrency(previewEarnings, currencySymbol)} earned.` })
        setForm(f => ({ ...f, note: "" }))
        setDialogOpen(false)
    }

    // Edit Form State
    const [editForm, setEditForm] = useState(() => ({
        date: todayStr,
        startTime: "09:00",
        endTime: "15:00",
        jobId: "",
        rateType: "weekday" as RateType,
        breakMinutes: 30,
        note: "",
    }))

    useEffect(() => {
        if (editDialogOpen && editShiftId) {
            const shift = shifts.find(s => s.id === editShiftId)
            if (shift) {
                setEditForm({
                    date: shift.date,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    jobId: shift.jobId,
                    rateType: shift.rateType,
                    breakMinutes: shift.breakMinutes,
                    note: shift.note || "",
                })
            }
        }
    }, [editDialogOpen, editShiftId, shifts])

    const editPreviewHours = calculateShiftHours(editForm.startTime, editForm.endTime, editForm.breakMinutes)
    const editPreviewJob = getJob(editForm.jobId)
    const editPreviewEarnings = editPreviewJob ? calculateShiftEarnings(editPreviewHours, editPreviewJob, editForm.rateType) : 0

    const handleEditSave = () => {
        if (!editForm.jobId || !editShiftId) return
        if (hasOverlap(shifts, editForm.date, editForm.startTime, editForm.endTime, editShiftId)) {
            toast({ title: "Updated shift overlaps", description: "Adjust times before saving.", variant: "destructive" })
            return
        }
        const job = getJob(editForm.jobId)
        if (!job) return
        updateShift(editShiftId, {
            date: editForm.date,
            startTime: editForm.startTime,
            endTime: editForm.endTime,
            jobId: editForm.jobId,
            rateType: editForm.rateType,
            breakMinutes: editForm.breakMinutes,
            hours: editPreviewHours,
            earnings: editPreviewEarnings,
            note: editForm.note || undefined,
        })
        trackEvent("shift_edited", { hours: editPreviewHours, earnings: editPreviewEarnings, rateType: editForm.rateType })
        toast({ title: "Shift updated", description: `Earnings adjusted to ${formatCurrency(editPreviewEarnings, currencySymbol)}.` })
        setEditDialogOpen(false)
        setEditShiftId(null)
    }

    // Job Form State
    const [jobForm, setJobForm] = useState({
        name: "",
        category: "custom" as JobTemplate["category"],
        baseRate: "25",
    })
    const jobBaseRate = parseFloat(jobForm.baseRate)
    const jobFormValid = jobForm.name.trim().length > 0 && !Number.isNaN(jobBaseRate) && jobBaseRate >= 0

    const handleAddJob = () => {
        if (!jobFormValid) return
        const id = addJob({ name: jobForm.name, category: jobForm.category, baseRate: jobBaseRate, rates: makeRates(jobBaseRate) })
        trackEvent("workplace_added", { category: jobForm.category })
        toast({ title: "Workplace added", description: jobForm.name })
        setForm(f => ({ ...f, jobId: id }))
        setJobForm({ name: "", category: "custom", baseRate: "25" })
        setJobDialogOpen(false)
    }

    // Recurring Form State
    const [recurringForm, setRecurringForm] = useState({
        name: "",
        jobId: jobs[0]?.id || "",
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 30,
        daysOfWeek: [] as number[],
        occurrences: "4",
    })

    const handleAddRecurring = () => {
        const occurrences = parseInt(recurringForm.occurrences)
        if (!recurringForm.jobId || recurringForm.daysOfWeek.length === 0 || Number.isNaN(occurrences)) return

        let shiftsAdded = 0
        const today = new Date()
        const job = getJob(recurringForm.jobId)
        if (!job) return

        for (let week = 0; week < occurrences; week++) {
            recurringForm.daysOfWeek.forEach(targetDay => {
                const date = new Date(today)
                date.setDate(today.getDate() + (targetDay - today.getDay() + 7) % 7 + week * 7)
                const dateStr = date.toISOString().split("T")[0]
                const rateType = detectRateType(dateStr, publicHolidays)
                const hours = calculateShiftHours(recurringForm.startTime, recurringForm.endTime, recurringForm.breakMinutes)
                const earnings = calculateShiftEarnings(hours, job, rateType)

                const wasAdded = addShift({
                    date: dateStr,
                    startTime: recurringForm.startTime,
                    endTime: recurringForm.endTime,
                    jobId: recurringForm.jobId,
                    rateType,
                    breakMinutes: recurringForm.breakMinutes,
                    hours,
                    earnings,
                    note: `${recurringForm.name || "Recurring shift"}`,
                })
                if (wasAdded) shiftsAdded++
            })
        }

        if (shiftsAdded === 0) return
        trackEvent("recurring_shifts_added", { count: shiftsAdded })
        toast({ title: "Recurring shifts added", description: `${shiftsAdded} shifts scheduled.` })
        setRecurringDialogOpen(false)
    }

    return (
        <>
            {/* Add Shift Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Log a Shift</DialogTitle></DialogHeader>
                    <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto px-1 py-1">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Job</Label>
                            {jobs.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                                    Add a workplace first to log shifts.
                                    <Button type="button" variant="ghost" size="sm" className="mt-2 w-fit" onClick={() => { setDialogOpen(false); setJobDialogOpen(true) }}>Add workplace</Button>
                                </div>
                            ) : (
                                <Select value={form.jobId} onValueChange={v => setForm(f => ({ ...f, jobId: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
                                    <SelectContent>
                                        {jobs.map(j => (
                                            <SelectItem key={j.id} value={j.id}>
                                                <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: j.color }} />{j.name}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="shift-date" className="text-xs">Date</Label>
                            <Input id="shift-date" type="date" value={form.date} onChange={e => handleDateChange(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="shift-start" className="text-xs">Start Time</Label>
                                <Input id="shift-start" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="h-10 sm:h-9" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="shift-end" className="text-xs">End Time</Label>
                                <Input id="shift-end" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="h-10 sm:h-9" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs">Rate Type</Label>
                                <Select value={form.rateType} onValueChange={v => setForm(f => ({ ...f, rateType: v as RateType }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(Object.keys(RATE_TYPE_LABELS) as RateType[]).map(rt => (
                                            <SelectItem key={rt} value={rt}>{RATE_TYPE_LABELS[rt]}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs">Break (min)</Label>
                                <Input type="number" inputMode="numeric" pattern="[0-9]*" className="h-10 sm:h-9" min={0} step={5} value={form.breakMinutes} onChange={e => setForm(f => ({ ...f, breakMinutes: parseInt(e.target.value) || 0 }))} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Note (optional)</Label>
                            <Input placeholder="e.g. Covered for Sarah" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                        </div>
                        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Hours</span><span className="font-medium text-foreground">{previewHours}h</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Rate</span><span className="font-medium text-foreground">{previewJob ? formatCurrency(previewJob.rates[form.rateType], currencySymbol) + "/hr" : "---"}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between border-t border-primary/10 pt-2">
                                <span className="text-sm font-medium text-foreground">Estimated Pay</span><span className="text-lg font-semibold text-primary">{formatCurrency(previewEarnings, currencySymbol)}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button onClick={handleAdd} disabled={!form.jobId}>Log Shift</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Shift Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={open => { setEditDialogOpen(open); if (!open) setEditShiftId(null) }}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Edit Shift</DialogTitle></DialogHeader>
                    <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto px-1 py-1">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Job</Label>
                            {jobs.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">Add a workplace first to log shifts.</div>
                            ) : (
                                <Select value={editForm.jobId} onValueChange={v => setEditForm(f => ({ ...f, jobId: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
                                    <SelectContent>
                                        {jobs.map(j => (
                                            <SelectItem key={j.id} value={j.id}>
                                                <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: j.color }} />{j.name}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="edit-shift-date" className="text-xs">Date</Label>
                            <Input id="edit-shift-date" type="date" value={editForm.date} onChange={e => { const detected = detectRateType(e.target.value, publicHolidays); setEditForm(f => ({ ...f, date: e.target.value, rateType: detected })) }} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="edit-shift-start" className="text-xs">Start Time</Label>
                                <Input id="edit-shift-start" type="time" value={editForm.startTime} onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))} className="h-10 sm:h-9" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="edit-shift-end" className="text-xs">End Time</Label>
                                <Input id="edit-shift-end" type="time" value={editForm.endTime} onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))} className="h-10 sm:h-9" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs">Rate Type</Label>
                                <Select value={editForm.rateType} onValueChange={v => setEditForm(f => ({ ...f, rateType: v as RateType }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(Object.keys(RATE_TYPE_LABELS) as RateType[]).map(rt => (
                                            <SelectItem key={rt} value={rt}>{RATE_TYPE_LABELS[rt]}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs">Break (min)</Label>
                                <Input type="number" inputMode="numeric" pattern="[0-9]*" className="h-10 sm:h-9" min={0} step={5} value={editForm.breakMinutes} onChange={e => setEditForm(f => ({ ...f, breakMinutes: parseInt(e.target.value) || 0 }))} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Note (optional)</Label>
                            <Input placeholder="e.g. Covered for Sarah" value={editForm.note} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} />
                        </div>
                        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Hours</span><span className="font-medium text-foreground">{editPreviewHours}h</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Rate</span><span className="font-medium text-foreground">{editPreviewJob ? formatCurrency(editPreviewJob.rates[editForm.rateType], currencySymbol) + "/hr" : "---"}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between border-t border-primary/10 pt-2">
                                <span className="text-sm font-medium text-foreground">Estimated Pay</span><span className="text-lg font-semibold text-primary">{formatCurrency(editPreviewEarnings, currencySymbol)}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button onClick={handleEditSave} disabled={!editForm.jobId}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Job Dialog */}
            <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add Workplace</DialogTitle></DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Workplace Name</Label>
                            <Input placeholder="e.g. Cafe Job" value={jobForm.name} onChange={e => setJobForm(j => ({ ...j, name: e.target.value }))} autoFocus />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Category</Label>
                            <Select value={jobForm.category} onValueChange={v => setJobForm(j => ({ ...j, category: v as JobTemplate["category"] }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hospitality">Food & Hospitality</SelectItem>
                                    <SelectItem value="retail">Retail</SelectItem>
                                    <SelectItem value="tutoring">Tutoring / Freelance</SelectItem>
                                    <SelectItem value="delivery">Delivery / Gig</SelectItem>
                                    <SelectItem value="custom">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Base Rate ({currencyStr}/hr)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-3 size-4 sm:top-2 text-muted-foreground" />
                                <Input type="text" inputMode="decimal" className="pl-9 h-10 sm:h-9" value={jobForm.baseRate} onChange={e => setJobForm(j => ({ ...j, baseRate: e.target.value.replace(/[^0-9.]/g, "") }))} />
                            </div>
                        </div>
                        <div className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
                            This sets all penalty rates to the same base rate. You can fine-tune rates on the Earnings page.
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button onClick={handleAddJob} disabled={!jobFormValid}>Add Workplace</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Recurring Shifts Dialog */}
            <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Schedule Recurring Shifts</DialogTitle></DialogHeader>
                    <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto px-1 py-1 -mx-1">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Template Name</Label>
                            <Input placeholder="e.g. Weekly cafe shifts" value={recurringForm.name} onChange={e => setRecurringForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Workplace</Label>
                            {jobs.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Add a workplace first.</p>
                            ) : (
                                <Select value={recurringForm.jobId} onValueChange={v => setRecurringForm(f => ({ ...f, jobId: v }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs">Start Time</Label>
                                <Input type="time" value={recurringForm.startTime} onChange={e => setRecurringForm(f => ({ ...f, startTime: e.target.value }))} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs">End Time</Label>
                                <Input type="time" value={recurringForm.endTime} onChange={e => setRecurringForm(f => ({ ...f, endTime: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Break (minutes)</Label>
                            <Input type="number" inputMode="numeric" pattern="[0-9]*" className="h-10 sm:h-9" min={0} step={5} value={recurringForm.breakMinutes} onChange={e => setRecurringForm(f => ({ ...f, breakMinutes: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Days of Week</Label>
                            <div className="flex gap-1 flex-wrap">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                                    <Button
                                        key={day}
                                        type="button"
                                        size="sm"
                                        variant={recurringForm.daysOfWeek.includes(idx) ? "default" : "outline"}
                                        className="h-8 min-w-[45px] flex-1 text-[10px] px-1"
                                        onClick={() => {
                                            const newDays = recurringForm.daysOfWeek.includes(idx) ? recurringForm.daysOfWeek.filter(d => d !== idx) : [...recurringForm.daysOfWeek, idx].sort()
                                            setRecurringForm(f => ({ ...f, daysOfWeek: newDays }))
                                        }}
                                    >
                                        {day}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Number of Weeks</Label>
                            <Input type="number" inputMode="numeric" pattern="[0-9]*" className="h-10 sm:h-9" min={1} max={12} value={recurringForm.occurrences} onChange={e => setRecurringForm(f => ({ ...f, occurrences: e.target.value }))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button onClick={handleAddRecurring} disabled={!recurringForm.jobId || recurringForm.daysOfWeek.length === 0}>Schedule Shifts</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
