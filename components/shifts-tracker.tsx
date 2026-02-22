"use client"

import { useState, useMemo } from "react"
import { Plus, Trash2, CalendarDays, List, Coffee, Briefcase, Filter, Download, Repeat, Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAppData } from "@/components/data-provider"
import { useToast } from "@/hooks/use-toast"
import {
  calculateShiftHours, calculateShiftEarnings, detectRateType,
  formatCurrency, RATE_TYPE_LABELS, type RateType, type PenaltyRates, type JobTemplate, type Shift
} from "@/lib/store"
import { trackEvent } from "@/lib/analytics"

export function ShiftsTracker() {
  const { data, addShift, removeShift, updateShift, addJob, getJob } = useAppData()
  const { toast } = useToast()
  const [view, setView] = useState<"list" | "calendar">("list")
  const [calMonth, setCalMonth] = useState(() => new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [jobDialogOpen, setJobDialogOpen] = useState(false)
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editShiftId, setEditShiftId] = useState<string | null>(null)

  // Filtering state
  const [filters, setFilters] = useState({
    jobId: "all",
    rateType: "all",
    dateFrom: "",
    dateTo: "",
  })

  const todayStr = new Date().toISOString().split("T")[0]
  const currencySymbol = data.settings.currencySymbol

  const [form, setForm] = useState(() => ({
    date: todayStr,
    startTime: "09:00",
    endTime: "15:00",
    jobId: data.jobs[0]?.id || "",
    rateType: detectRateType(todayStr, data.publicHolidays) as RateType,
    breakMinutes: 30,
    note: "",
  }))

  const [editForm, setEditForm] = useState(() => ({
    date: todayStr,
    startTime: "09:00",
    endTime: "15:00",
    jobId: data.jobs[0]?.id || "",
    rateType: "weekday" as RateType,
    breakMinutes: 30,
    note: "",
  }))

  const [jobForm, setJobForm] = useState({
    name: "",
    category: "custom" as JobTemplate["category"],
    baseRate: "25",
  })
  const jobBaseRate = parseFloat(jobForm.baseRate)
  const jobFormValid = jobForm.name.trim().length > 0 && !Number.isNaN(jobBaseRate) && jobBaseRate >= 0

  // Recurring shift form
  const [recurringForm, setRecurringForm] = useState({
    name: "",
    jobId: data.jobs[0]?.id || "",
    startTime: "09:00",
    endTime: "17:00",
    breakMinutes: 30,
    daysOfWeek: [] as number[], // 0=Sun, 1=Mon, etc.
    occurrences: "4",
  })

  const makeRates = (base: number): PenaltyRates => ({
    weekday: base,
    saturday: base,
    sunday: base,
    public_holiday: base,
    overtime: base,
  })

  // Auto-detect rate type when date changes
  const handleDateChange = (date: string) => {
    const detected = detectRateType(date, data.publicHolidays)
    setForm(f => ({ ...f, date, rateType: detected }))
  }

  const handleEditDateChange = (date: string) => {
    const detected = detectRateType(date, data.publicHolidays)
    setEditForm(f => ({ ...f, date, rateType: detected }))
  }

  const previewHours = calculateShiftHours(form.startTime, form.endTime, form.breakMinutes)
  const previewJob = getJob(form.jobId)
  const previewEarnings = previewJob ? calculateShiftEarnings(previewHours, previewJob, form.rateType) : 0

  const editPreviewHours = calculateShiftHours(editForm.startTime, editForm.endTime, editForm.breakMinutes)
  const editPreviewJob = getJob(editForm.jobId)
  const editPreviewEarnings = editPreviewJob ? calculateShiftEarnings(editPreviewHours, editPreviewJob, editForm.rateType) : 0

  const handleAdd = () => {
    if (!form.jobId) return
    const hours = calculateShiftHours(form.startTime, form.endTime, form.breakMinutes)
    const job = getJob(form.jobId)
    if (!job) return
    const earnings = calculateShiftEarnings(hours, job, form.rateType)
    addShift({
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      jobId: form.jobId,
      rateType: form.rateType,
      breakMinutes: form.breakMinutes,
      hours,
      earnings,
      note: form.note || undefined,
    })
    trackEvent("shift_added", { hours, earnings, rateType: form.rateType })
    toast({ title: "Shift logged", description: `${formatCurrency(earnings, currencySymbol)} earned.` })
    setForm(f => ({ ...f, note: "" }))
    setDialogOpen(false)
  }

  const handleEditSave = () => {
    if (!editForm.jobId || !editShiftId) return
    const hours = calculateShiftHours(editForm.startTime, editForm.endTime, editForm.breakMinutes)
    const job = getJob(editForm.jobId)
    if (!job) return
    const earnings = calculateShiftEarnings(hours, job, editForm.rateType)
    updateShift(editShiftId, {
      date: editForm.date,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      jobId: editForm.jobId,
      rateType: editForm.rateType,
      breakMinutes: editForm.breakMinutes,
      hours,
      earnings,
      note: editForm.note || undefined,
    })
    trackEvent("shift_edited", { hours, earnings, rateType: editForm.rateType })
    toast({ title: "Shift updated", description: `Earnings adjusted to ${formatCurrency(earnings, currencySymbol)}.` })
    setEditDialogOpen(false)
    setEditShiftId(null)
  }

  const openEditDialog = (shift: Shift) => {
    setEditShiftId(shift.id)
    setEditForm({
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      jobId: shift.jobId,
      rateType: shift.rateType,
      breakMinutes: shift.breakMinutes,
      note: shift.note || "",
    })
    setEditDialogOpen(true)
  }

  const handleAddJob = () => {
    const baseRate = parseFloat(jobForm.baseRate)
    if (!jobForm.name || Number.isNaN(baseRate)) return
    const id = addJob({
      name: jobForm.name,
      category: jobForm.category,
      baseRate,
      rates: makeRates(baseRate),
    })
    trackEvent("workplace_added", { category: jobForm.category })
    toast({ title: "Workplace added", description: jobForm.name })
    setForm(f => ({ ...f, jobId: id }))
    setJobForm({ name: "", category: "custom", baseRate: "25" })
    setJobDialogOpen(false)
  }

  const handleAddRecurring = () => {
    const occurrences = parseInt(recurringForm.occurrences)
    if (!recurringForm.jobId || recurringForm.daysOfWeek.length === 0 || Number.isNaN(occurrences)) return

    let shiftsAdded = 0
    const today = new Date()
    const job = getJob(recurringForm.jobId)
    if (!job) return

    // Find next occurrences for selected days
    for (let week = 0; week < occurrences; week++) {
      recurringForm.daysOfWeek.forEach(targetDay => {
        const date = new Date(today)
        date.setDate(today.getDate() + (targetDay - today.getDay() + 7) % 7 + week * 7)
        const dateStr = date.toISOString().split("T")[0]
        const rateType = detectRateType(dateStr, data.publicHolidays)
        const hours = calculateShiftHours(recurringForm.startTime, recurringForm.endTime, recurringForm.breakMinutes)
        const earnings = calculateShiftEarnings(hours, job, rateType)

        addShift({
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
        shiftsAdded++
      })
    }

    trackEvent("recurring_shifts_added", { count: shiftsAdded })
    toast({ title: "Recurring shifts added", description: `${shiftsAdded} shifts scheduled.` })
    setRecurringDialogOpen(false)
  }

  const exportToICalendar = () => {
    const shifts = filteredShifts.length > 0 ? filteredShifts : data.shifts
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ShiftWise//EN",
      "CALSCALE:GREGORIAN",
    ]

    shifts.forEach(shift => {
      const job = jobsById.get(shift.jobId)
      const startDT = shift.date.replace(/-/g, "") + "T" + shift.startTime.replace(":", "") + "00"
      const endDT = shift.date.replace(/-/g, "") + "T" + shift.endTime.replace(":", "") + "00"
      const uid = `shift-${shift.id}@shiftwise.app`

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTSTART:${startDT}`,
        `DTEND:${endDT}`,
        `SUMMARY:${job?.name || "Shift"} - ${RATE_TYPE_LABELS[shift.rateType]}`,
        `DESCRIPTION:${shift.hours}h @ ${formatCurrency(shift.earnings / shift.hours, currencySymbol)}/hr = ${formatCurrency(shift.earnings, currencySymbol)}${shift.note ? "\\n" + shift.note : ""}`,
        "END:VEVENT"
      )
    })

    lines.push("END:VCALENDAR")
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `shiftwise-${new Date().toISOString().split("T")[0]}.ics`
    a.click()
    URL.revokeObjectURL(url)

    trackEvent("calendar_exported", { count: shifts.length })
    toast({ title: "Calendar exported", description: `${shifts.length} shifts exported to iCal.` })
  }

  const sortedShifts = useMemo(() => [...data.shifts].sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)), [data.shifts])

  // Apply filters
  const filteredShifts = useMemo(() => {
    return sortedShifts.filter(shift => {
      if (filters.jobId !== "all" && shift.jobId !== filters.jobId) return false
      if (filters.rateType !== "all" && shift.rateType !== filters.rateType) return false
      if (filters.dateFrom && shift.date < filters.dateFrom) return false
      if (filters.dateTo && shift.date > filters.dateTo) return false
      return true
    })
  }, [sortedShifts, filters])

  const jobsById = useMemo(() => new Map(data.jobs.map(job => [job.id, job])), [data.jobs])

  // Calendar helpers
  const calDays = useMemo(() => {
    const y = calMonth.getFullYear()
    const m = calMonth.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const offset = (first.getDay() + 6) % 7 // monday=0
    const days: Date[] = []
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(y, m, d))
    return { days, offset }
  }, [calMonth])

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, typeof data.shifts>()
    data.shifts.forEach(shift => {
      const list = map.get(shift.date) ?? []
      list.push(shift)
      map.set(shift.date, list)
    })
    return map
  }, [data])

  const calMonthLabel = calMonth.toLocaleDateString("en-AU", { month: "long", year: "numeric" })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Shifts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track hours with Australian penalty rates.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Filter className="size-4" />
                <span className="hidden sm:inline">Filter</span>
                {(filters.jobId !== "all" || filters.rateType !== "all" || filters.dateFrom || filters.dateTo) && (
                  <Badge variant="secondary" className="ml-1 size-4 p-0 text-[9px] flex items-center justify-center rounded-full">!</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="mb-3 text-sm font-medium">Filter Shifts</h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Workplace</Label>
                      <Select value={filters.jobId} onValueChange={v => setFilters(f => ({ ...f, jobId: v }))}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Workplaces</SelectItem>
                          {data.jobs.map(j => (
                            <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Rate Type</Label>
                      <Select value={filters.rateType} onValueChange={v => setFilters(f => ({ ...f, rateType: v }))}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {(Object.keys(RATE_TYPE_LABELS) as RateType[]).map(rt => (
                            <SelectItem key={rt} value={rt}>{RATE_TYPE_LABELS[rt]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">From</Label>
                        <Input type="date" className="h-8" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">To</Label>
                        <Input type="date" className="h-8" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
                      </div>
                    </div>
                    {(filters.jobId !== "all" || filters.rateType !== "all" || filters.dateFrom || filters.dateTo) && (
                      <Button size="sm" variant="ghost" onClick={() => setFilters({ jobId: "all", rateType: "all", dateFrom: "", dateTo: "" })}>
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Export Button */}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={exportToICalendar}>
            <Download className="size-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          {/* Recurring Shifts Dialog */}
          <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Repeat className="size-4" />
                <span className="hidden sm:inline">Recurring</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule Recurring Shifts</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Template Name</Label>
                  <Input placeholder="e.g. Weekly cafe shifts" value={recurringForm.name} onChange={e => setRecurringForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Workplace</Label>
                  {data.jobs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Add a workplace first.</p>
                  ) : (
                    <Select value={recurringForm.jobId} onValueChange={v => setRecurringForm(f => ({ ...f, jobId: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {data.jobs.map(j => (
                          <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                        ))}
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
                  <Input type="number" min={0} step={5} value={recurringForm.breakMinutes} onChange={e => setRecurringForm(f => ({ ...f, breakMinutes: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Days of Week</Label>
                  <div className="flex gap-1">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                      <Button
                        key={day}
                        type="button"
                        size="sm"
                        variant={recurringForm.daysOfWeek.includes(idx) ? "default" : "outline"}
                        className="flex-1 text-xs px-2"
                        onClick={() => {
                          const newDays = recurringForm.daysOfWeek.includes(idx)
                            ? recurringForm.daysOfWeek.filter(d => d !== idx)
                            : [...recurringForm.daysOfWeek, idx].sort()
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
                  <Input type="number" min={1} max={12} value={recurringForm.occurrences} onChange={e => setRecurringForm(f => ({ ...f, occurrences: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleAddRecurring} disabled={!recurringForm.jobId || recurringForm.daysOfWeek.length === 0}>
                  Schedule Shifts
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Briefcase className="size-4" />
                <span className="hidden sm:inline">Add Workplace</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Workplace</DialogTitle>
              </DialogHeader>
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
                  <Label className="text-xs">Base Rate (AUD/hr)</Label>
                  <Input type="number" step="0.01" min={0} value={jobForm.baseRate} onChange={e => setJobForm(j => ({ ...j, baseRate: e.target.value }))} />
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

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Shift</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log a Shift</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                {/* Job select */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Job</Label>
                  {data.jobs.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                      Add a workplace first to log shifts.
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-fit"
                        onClick={() => {
                          setDialogOpen(false)
                          setJobDialogOpen(true)
                        }}
                      >
                        Add workplace
                      </Button>
                    </div>
                  ) : (
                    <Select value={form.jobId} onValueChange={v => setForm(f => ({ ...f, jobId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
                      <SelectContent>
                        {data.jobs.map(j => (
                          <SelectItem key={j.id} value={j.id}>
                            <span className="flex items-center gap-2">
                              <span className="size-2 rounded-full" style={{ background: j.color }} />
                              {j.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="shift-date" className="text-xs">Date</Label>
                  <Input id="shift-date" type="date" value={form.date} onChange={e => handleDateChange(e.target.value)} />
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="shift-start" className="text-xs">Start Time</Label>
                    <Input id="shift-start" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="shift-end" className="text-xs">End Time</Label>
                    <Input id="shift-end" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                  </div>
                </div>

                {/* Rate type & break */}
                <div className="grid grid-cols-2 gap-3">
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
                    <Input type="number" min={0} step={5} value={form.breakMinutes} onChange={e => setForm(f => ({ ...f, breakMinutes: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>

                {/* Note */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Note (optional)</Label>
                  <Input placeholder="e.g. Covered for Sarah" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                </div>

                {/* Preview */}
                <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hours</span>
                    <span className="font-medium text-foreground">{previewHours}h</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-medium text-foreground">
                      {previewJob ? formatCurrency(previewJob.rates[form.rateType], currencySymbol) + "/hr" : "---"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-primary/10 pt-2">
                    <span className="text-sm font-medium text-foreground">Estimated Pay</span>
                    <span className="text-lg font-semibold text-primary">{formatCurrency(previewEarnings, currencySymbol)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleAdd} disabled={!form.jobId}>Log Shift</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={open => {
            setEditDialogOpen(open)
            if (!open) setEditShiftId(null)
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Shift</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                {/* Job select */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Job</Label>
                  {data.jobs.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                      Add a workplace first to log shifts.
                    </div>
                  ) : (
                    <Select value={editForm.jobId} onValueChange={v => setEditForm(f => ({ ...f, jobId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
                      <SelectContent>
                        {data.jobs.map(j => (
                          <SelectItem key={j.id} value={j.id}>
                            <span className="flex items-center gap-2">
                              <span className="size-2 rounded-full" style={{ background: j.color }} />
                              {j.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-shift-date" className="text-xs">Date</Label>
                  <Input id="edit-shift-date" type="date" value={editForm.date} onChange={e => handleEditDateChange(e.target.value)} />
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="edit-shift-start" className="text-xs">Start Time</Label>
                    <Input id="edit-shift-start" type="time" value={editForm.startTime} onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="edit-shift-end" className="text-xs">End Time</Label>
                    <Input id="edit-shift-end" type="time" value={editForm.endTime} onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))} />
                  </div>
                </div>

                {/* Rate type & break */}
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
                    <Input type="number" min={0} step={5} value={editForm.breakMinutes} onChange={e => setEditForm(f => ({ ...f, breakMinutes: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>

                {/* Note */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Note (optional)</Label>
                  <Input placeholder="e.g. Covered for Sarah" value={editForm.note} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} />
                </div>

                {/* Preview */}
                <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hours</span>
                    <span className="font-medium text-foreground">{editPreviewHours}h</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-medium text-foreground">
                      {editPreviewJob ? formatCurrency(editPreviewJob.rates[editForm.rateType], currencySymbol) + "/hr" : "---"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-primary/10 pt-2">
                    <span className="text-sm font-medium text-foreground">Estimated Pay</span>
                    <span className="text-lg font-semibold text-primary">{formatCurrency(editPreviewEarnings, currencySymbol)}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleEditSave} disabled={!editForm.jobId}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={view} onValueChange={v => setView(v as "list" | "calendar")}>
        <TabsList>
          <TabsTrigger value="list" className="gap-1.5"><List className="size-3.5" />List</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5"><CalendarDays className="size-3.5" />Calendar</TabsTrigger>
        </TabsList>

        {/* LIST VIEW */}
        <TabsContent value="list">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {filteredShifts.length} shift{filteredShifts.length !== 1 ? "s" : ""}
                {filteredShifts.length !== data.shifts.length && ` (${data.shifts.length} total)`}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {filteredShifts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {data.shifts.length === 0 ? "No shifts yet. Log your first one above." : "No shifts match your filters."}
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {filteredShifts.map(shift => {
                    const job = jobsById.get(shift.jobId)
                    return (
                      <div key={shift.id} className="flex items-center gap-3 py-3">
                        <div className="size-2 rounded-full shrink-0" style={{ background: job?.color || "#94a3b8" }} />
                        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{job?.name || "Unknown"}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{RATE_TYPE_LABELS[shift.rateType]}</Badge>
                            {shift.breakMinutes > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Coffee className="size-2.5" />{shift.breakMinutes}m
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(shift.date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })} &middot; {shift.startTime}&ndash;{shift.endTime} &middot; {shift.hours}h
                            {shift.note && <> &middot; {shift.note}</>}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-sm font-medium text-foreground mr-1">{formatCurrency(shift.earnings, currencySymbol)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-primary"
                            onClick={() => openEditDialog(shift)}
                            aria-label="Edit shift"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              removeShift(shift.id)
                              trackEvent("shift_removed")
                              toast({ title: "Shift removed" })
                            }}
                            aria-label="Remove shift"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CALENDAR VIEW */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{calMonthLabel}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>Prev</Button>
                <Button variant="ghost" size="sm" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>Next</Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-7 gap-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                  <div key={d} className="p-2 text-center text-[11px] font-medium text-muted-foreground">{d}</div>
                ))}
                {Array.from({ length: calDays.offset }).map((_, i) => <div key={`e${i}`} />)}
                {calDays.days.map(day => {
                  const dayStr = day.toISOString().split("T")[0]
                  const dayShifts = shiftsByDate.get(dayStr) ?? []
                  const isToday = dayStr === todayStr
                  const isPH = data.publicHolidays.includes(dayStr)
                  return (
                    <div
                      key={dayStr}
                      className={`relative flex min-h-[3.5rem] flex-col items-center rounded-lg p-1.5 text-xs transition-colors ${isToday ? "bg-primary/10 ring-1 ring-primary/30"
                        : isPH ? "bg-destructive/5"
                          : "hover:bg-secondary/50"
                        }`}
                    >
                      <span className={`font-medium ${isToday ? "text-primary" : isPH ? "text-destructive" : "text-foreground"}`}>
                        {day.getDate()}
                      </span>
                      {dayShifts.length > 0 && (
                        <div className="mt-0.5 flex flex-col items-center gap-0.5">
                          <div className="flex gap-0.5">
                            {dayShifts.slice(0, 3).map(s => {
                              const j = jobsById.get(s.jobId)
                              return <div key={s.id} className="size-1.5 rounded-full" style={{ background: j?.color || "#94a3b8" }} />
                            })}
                          </div>
                          <span className="text-[9px] text-muted-foreground">
                            {dayShifts.reduce((s, sh) => s + sh.hours, 0)}h
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
