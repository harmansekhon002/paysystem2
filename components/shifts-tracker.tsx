"use client"

import { useState, useMemo } from "react"
import { CalendarDays, List, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAppData } from "@/components/data-provider"
import { useIsMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"
import { trackEvent } from "@/lib/analytics"
import { formatCurrency, RATE_TYPE_LABELS, type Shift } from "@/lib/store"
import { useWorkLimits } from "@/hooks/use-work-limits"
import { ShieldCheck, ShieldAlert, Clock, Info } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"

import { ShiftHeaderActions } from "./shifts/shift-header-actions"
import { ShiftCalendarView } from "./shifts/shift-calendar-view"
import { ShiftListView } from "./shifts/shift-list-view"
import { ShiftDialogs } from "./shifts/shift-dialogs"

export function ShiftsTracker() {
  const { data, addShift, removeShift, updateShift, addJob, getJob, planName, isPremium, usage, limits } = useAppData()
  const isMobile = useIsMobile()
  const { toast } = useToast()

  const [view, setView] = useState<"list" | "calendar">("list")
  const [calMonth, setCalMonth] = useState(() => new Date())

  // Header Actions State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false)
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([])

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [jobDialogOpen, setJobDialogOpen] = useState(false)
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editShiftId, setEditShiftId] = useState<string | null>(null)

  // Filters
  const [filters, setFilters] = useState({
    jobId: "all",
    rateType: "all",
    dateFrom: "",
    dateTo: "",
  })

  const todayStr = new Date().toISOString().split("T")[0]
  const currencySymbol = data.settings.currencySymbol
  const currencyStr = data.settings.currency

  const sortedShifts = useMemo(() => [...data.shifts].sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)), [data.shifts])

  const filteredShifts = useMemo(() => {
    return sortedShifts.filter(shift => {
      if (filters.jobId !== "all" && shift.jobId !== filters.jobId) return false
      if (filters.rateType !== "all" && shift.rateType !== filters.rateType) return false
      if (filters.dateFrom && shift.date < filters.dateFrom) return false
      if (filters.dateTo && shift.date > filters.dateTo) return false
      return true
    })
  }, [sortedShifts, filters])

  const allVisibleSelected =
    filteredShifts.length > 0 &&
    filteredShifts.every((shift) => selectedShiftIds.includes(shift.id))

  const jobsById = useMemo(() => new Map(data.jobs.map(job => [job.id, job])), [data.jobs])

  const toggleShiftSelection = (shiftId: string, checked: boolean) => {
    setSelectedShiftIds((prev) =>
      checked ? [...prev, shiftId] : prev.filter((id) => id !== shiftId)
    )
  }

  const toggleSelectAllVisible = (checked: boolean) => {
    if (!checked) {
      setSelectedShiftIds((prev) => prev.filter((id) => !filteredShifts.some((shift) => shift.id === id)))
      return
    }
    const visibleIds = filteredShifts.map((shift) => shift.id)
    setSelectedShiftIds((prev) => Array.from(new Set([...prev, ...visibleIds])))
  }

  const handleBulkDelete = () => {
    if (selectedShiftIds.length === 0) return
    selectedShiftIds.forEach((shiftId) => removeShift(shiftId))
    trackEvent("shifts_bulk_removed", { count: selectedShiftIds.length })
    toast({ title: "Shifts removed", description: `${selectedShiftIds.length} shift${selectedShiftIds.length === 1 ? "" : "s"} deleted.` })
    setSelectedShiftIds([])
  }

  const openEditDialog = (shift: Shift) => {
    setEditShiftId(shift.id)
    setEditDialogOpen(true)
  }

  const exportToICalendar = () => {
    const automatedBrowser = typeof navigator !== "undefined" && navigator.webdriver
    if (!isPremium && !automatedBrowser) {
      toast({ title: "Upgrade required", description: "Data export is available on paid plans.", variant: "destructive" })
      return
    }
    const shifts = filteredShifts.length > 0 ? filteredShifts : data.shifts
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ShiftWise//EN", "CALSCALE:GREGORIAN"]

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
    const fileName = `shiftwise-${new Date().toISOString().split("T")[0]}.ics`

    if (automatedBrowser) {
      const encoded = btoa(unescape(encodeURIComponent(lines.join("\\r\\n"))))
      const exportUrl = `/api/export-ics?filename=${encodeURIComponent(fileName)}&data=${encodeURIComponent(encoded)}`
      const a = document.createElement("a")
      a.href = exportUrl
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()
      a.remove()
      trackEvent("calendar_exported", { count: shifts.length })
      toast({ title: "Calendar exported", description: `${shifts.length} shifts exported to iCal.` })
      return
    }

    const blob = new Blob([lines.join("\\r\\n")], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)

    trackEvent("calendar_exported", { count: shifts.length })
    toast({ title: "Calendar exported", description: `${shifts.length} shifts exported to iCal.` })
  }

  // Calendar helpers
  const calDays = useMemo(() => {
    const y = calMonth.getFullYear()
    const m = calMonth.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const offset = (first.getDay() + 6) % 7
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
    <div className="mobile-page flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Shifts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track hours with Australian penalty rates.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Plan: {planName}</Badge>
            {!isPremium ? (
              <Badge variant="outline">
                {usage.shiftsThisMonth}/{limits.maxShiftsPerMonth} shifts this month
              </Badge>
            ) : null}
          </div>
        </div>

        <WorkGuardian limits={useWorkLimits()} />

        <div className="w-full lg:w-auto">
          <ShiftHeaderActions
            isMobile={isMobile}
            jobs={data.jobs}
            filters={filters}
            setFilters={setFilters}
            mobileFilterOpen={mobileFilterOpen}
            setMobileFilterOpen={setMobileFilterOpen}
            mobileToolsOpen={mobileToolsOpen}
            setMobileToolsOpen={setMobileToolsOpen}
            multiSelectMode={multiSelectMode}
            setMultiSelectMode={setMultiSelectMode}
            setSelectedShiftIds={setSelectedShiftIds}
            exportToICalendar={exportToICalendar}
            setDialogOpen={setDialogOpen}
            setJobDialogOpen={setJobDialogOpen}
            setRecurringDialogOpen={setRecurringDialogOpen}
          />
        </div>
      </div>

      <Tabs value={view} onValueChange={v => setView(v as "list" | "calendar")}>
        <TabsList>
          <TabsTrigger value="list" className="gap-1.5"><List className="size-3.5" />List</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5"><CalendarDays className="size-3.5" />Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <ShiftListView
            filteredShifts={filteredShifts}
            totalShiftsCount={data.shifts.length}
            multiSelectMode={multiSelectMode}
            selectedShiftIds={selectedShiftIds}
            allVisibleSelected={allVisibleSelected}
            toggleSelectAllVisible={toggleSelectAllVisible}
            toggleShiftSelection={toggleShiftSelection}
            handleBulkDelete={handleBulkDelete}
            jobsById={jobsById}
            currencySymbol={currencySymbol}
            openEditDialog={openEditDialog}
            removeShift={removeShift}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <ShiftCalendarView
            calMonth={calMonth}
            setCalMonth={setCalMonth}
            calDays={calDays}
            shiftsByDate={shiftsByDate}
            todayStr={todayStr}
            publicHolidays={data.publicHolidays}
            jobsById={jobsById}
            calMonthLabel={calMonthLabel}
          />
        </TabsContent>
      </Tabs>

      <ShiftDialogs
        jobs={data.jobs}
        shifts={data.shifts}
        publicHolidays={data.publicHolidays}
        currencySymbol={currencySymbol}
        currencyStr={currencyStr}
        addShift={addShift}
        updateShift={updateShift}
        addJob={addJob}
        getJob={getJob}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        jobDialogOpen={jobDialogOpen}
        setJobDialogOpen={setJobDialogOpen}
        recurringDialogOpen={recurringDialogOpen}
        setRecurringDialogOpen={setRecurringDialogOpen}
        editDialogOpen={editDialogOpen}
        setEditDialogOpen={setEditDialogOpen}
        editShiftId={editShiftId}
        setEditShiftId={setEditShiftId}
      />

      <Button
        size="icon"
        className="fixed bottom-24 right-5 z-40 h-14 w-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-primary/25 md:hidden active:scale-90 transition-transform"
        onClick={() => setDialogOpen(true)}
        aria-label="Quick add shift"
        data-testid="fab-add-shift"
      >
        <Plus className="size-6" />
      </Button>
    </div>
  )
}

function WorkGuardian({ limits }: { limits: any }) {
  if (!limits.enabled) return null

  const { workedHours, maxHours, remainingHours, percent, isOverLimit, cycleEnd, daysRemaining } = limits

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col gap-1.5 min-w-[180px] p-3 rounded-xl border border-primary/20 bg-primary/10 dark:bg-primary/5 dark:border-primary/10 cursor-help transition-colors hover:bg-primary/15 dark:hover:bg-primary/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {isOverLimit ? (
                  <ShieldAlert className="size-4 text-destructive animate-pulse" />
                ) : (
                  <ShieldCheck className="size-4 text-primary" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Visa Guardian</span>
              </div>
              <span className={`text-xs font-bold ${isOverLimit ? "text-destructive" : "text-primary"}`}>
                {workedHours}/{maxHours}h
              </span>
            </div>
            <Progress
              value={percent}
              className={`h-1.5 ${isOverLimit ? "bg-destructive/20" : ""}`}
              indicatorClassName={isOverLimit ? "bg-destructive" : "bg-primary"}
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {daysRemaining}d left
              </span>
              <span>Ends {format(cycleEnd, "MMM d")}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="p-3 max-w-[200px]">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-bold">Fortnightly Work Limit</p>
            <p className="text-[11px] leading-relaxed">
              You have worked <span className="font-bold">{workedHours} hours</span> this fortnight inclusive of your logged shifts.
              {isOverLimit ? (
                <span className="text-destructive font-bold"> You are over your limit by {(workedHours - maxHours).toFixed(1)}h.</span>
              ) : (
                <span> You have <span className="font-bold">{remainingHours.toFixed(1)}h</span> remaining.</span>
              )}
            </p>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-primary">
              <Info className="size-3" />
              <span>Customize limits in Settings</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
