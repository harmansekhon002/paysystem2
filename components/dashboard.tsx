"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  ChevronDown,
  Clock,
  DollarSign,
  Heart,
  LayoutDashboard,
  Plus,
  Receipt,
  TrendingUp,
} from "lucide-react"
import { useAppData } from "@/components/data-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"
import { calculateShiftEarnings, detectRateType, formatCurrency, RATE_TYPE_LABELS } from "@/lib/store"

const DashboardChartInsights = dynamic(
  () => import("@/components/dashboard-chart-insights").then((mod) => mod.DashboardChartInsights),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Loading insights...
        </CardContent>
      </Card>
    ),
  }
)

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = false,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  accent?: boolean
}) {
  return (
    <Card className={accent ? "transition-shadow !hover:shadow-[0_0_0_3px_var(--card-hover-glow)]" : ""}>
      <CardContent className="flex items-start justify-between p-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
        <div className="flex size-9 items-center justify-center rounded-xl bg-secondary">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

function formatTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

export function Dashboard() {
  const { data, getJob, addShift, addExpense, updateShift, planName, isPremium, usage, limits, isSpecialUser, displayName } = useAppData()
  const { resolvedTheme } = useTheme()
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const { shifts, jobs, expenses, budgetCategories } = data
  const currencySymbol = data.settings.currencySymbol
  const hasShifts = shifts.length > 0
  const today = new Date().toISOString().split("T")[0]
  const widgetConfig = data.settings.dashboardWidgets

  const [quickJobId, setQuickJobId] = useState<string>("")
  const [quickHours, setQuickHours] = useState<string>("4")
  const [quickExpenseAmount, setQuickExpenseAmount] = useState<string>("")
  const [quickExpenseCategory, setQuickExpenseCategory] = useState<string>("Transport")
  const [quickExpenseDescription, setQuickExpenseDescription] = useState<string>("Quick expense")
  const [mobileInsightsOpen, setMobileInsightsOpen] = useState(false)
  const MISSED_SHIFT_TAG = "[MISSED]"

  useEffect(() => {
    if (!quickJobId && jobs.length > 0) {
      setQuickJobId(jobs[0].id)
    }
  }, [jobs, quickJobId])

  useEffect(() => {
    if (!isSpecialUser || typeof window === "undefined") return
    const shouldWelcome = sessionStorage.getItem("shiftwise:wifey-login-welcome") === "1"
    if (!shouldWelcome) return

    sessionStorage.removeItem("shiftwise:wifey-login-welcome")
    toast({
      title: "Welcome wifey",
      description: "Your dashboard is ready with your puppy touches.",
    })
  }, [isSpecialUser, toast])

  const stats = useMemo(() => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    const thisWeekStr = monday.toISOString().split("T")[0]

    const weekShifts = shifts.filter((s) => s.date >= thisWeekStr)
    const weekHours = weekShifts.reduce((sum, s) => sum + s.hours, 0)
    const weekEarnings = weekShifts.reduce((sum, s) => sum + s.earnings, 0)

    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
    const monthShifts = shifts.filter((s) => s.date >= monthStart)
    const monthEarnings = monthShifts.reduce((sum, s) => sum + s.earnings, 0)
    const monthHours = monthShifts.reduce((sum, s) => sum + s.hours, 0)

    const monthExpenses = expenses.filter((e) => e.date >= monthStart).reduce((sum, e) => sum + e.amount, 0)
    const totalBudgeted = budgetCategories.reduce((sum, c) => sum + c.budgeted, 0)

    const todayStr = now.toISOString().split("T")[0]
    const upcomingShifts = shifts
      .filter((s) => s.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .slice(0, 4)

    return { weekHours, weekEarnings, monthEarnings, monthHours, monthExpenses, totalBudgeted, upcomingShifts }
  }, [shifts, expenses, budgetCategories])

  const weeklyChartData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))

    return days.map((label, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = d.toISOString().split("T")[0]
      const dayShifts = shifts.filter((s) => s.date === dateStr)
      const earnings = dayShifts.reduce((sum, s) => sum + s.earnings, 0)
      return { day: label, earnings: Math.round(earnings * 100) / 100 }
    })
  }, [shifts])

  const jobPieData = useMemo(() => {
    const byJob: Record<string, number> = {}
    shifts.forEach((s) => {
      const job = getJob(s.jobId)
      if (job) byJob[job.name] = (byJob[job.name] || 0) + s.earnings
    })
    return Object.entries(byJob).map(([name, value]) => {
      const job = jobs.find((j) => j.name === name)
      return { name, value: Math.round(value * 100) / 100, color: job?.color || "#94a3b8" }
    })
  }, [shifts, jobs, getJob])

  const profitabilityRows = useMemo(() => {
    const todayDate = new Date()
    const periodStartDate = new Date(todayDate)
    periodStartDate.setDate(todayDate.getDate() - 30)
    const periodStart = periodStartDate.toISOString().split("T")[0]

    const periodShifts = shifts.filter((s) => s.date >= periodStart)
    const periodExpenses = expenses.filter((e) => e.date >= periodStart)
    const totalHours = periodShifts.reduce((sum, s) => sum + s.hours, 0)
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0)
    const expensePerHour = totalHours > 0 ? totalExpenses / totalHours : 0

    return jobs
      .map((job) => {
        const jobShifts = periodShifts.filter((s) => s.jobId === job.id)
        const hours = jobShifts.reduce((sum, s) => sum + s.hours, 0)
        const earnings = jobShifts.reduce((sum, s) => sum + s.earnings, 0)
        const shiftCount = jobShifts.length
        const grossHourly = hours > 0 ? earnings / hours : 0
        const netHourly = Math.max(grossHourly - expensePerHour, 0)
        return {
          id: job.id,
          name: job.name,
          hours,
          earnings,
          shiftCount,
          grossHourly,
          netHourly,
          color: job.color,
        }
      })
      .filter((row) => row.hours > 0)
      .sort((a, b) => b.netHourly - a.netHourly)
  }, [jobs, shifts, expenses])

  const handleQuickAddShift = () => {
    const job = jobs.find((item) => item.id === quickJobId)
    const hours = Number(quickHours)
    if (!job) {
      toast({ title: "Select a job", description: "Choose a job before adding a quick shift." })
      return
    }
    if (!Number.isFinite(hours) || hours <= 0) {
      toast({ title: "Invalid hours", description: "Enter a valid shift duration." })
      return
    }

    const now = new Date()
    const start = new Date(now)
    start.setMinutes(0, 0, 0)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + Math.round(hours * 60))

    const rateType = detectRateType(today, data.publicHolidays)
    const earnings = calculateShiftEarnings(hours, job, rateType)

    const wasAdded = addShift({
      date: today,
      startTime: formatTime(start),
      endTime: formatTime(end),
      jobId: job.id,
      rateType,
      breakMinutes: 0,
      hours,
      earnings,
      note: "Quick added from dashboard",
    })
    if (!wasAdded) return

    toast({
      title: "Shift added",
      description: `${job.name} · ${hours}h · ${formatCurrency(earnings, currencySymbol)}`,
    })
  }

  const handleQuickAddExpense = () => {
    const amount = Number(quickExpenseAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Invalid amount", description: "Enter a valid expense amount." })
      return
    }

    addExpense({
      amount,
      category: quickExpenseCategory.trim() || "General",
      description: quickExpenseDescription.trim() || "Quick expense",
      date: today,
    })

    setQuickExpenseAmount("")
    toast({
      title: "Expense added",
      description: `${formatCurrency(amount, currencySymbol)} in ${quickExpenseCategory}`,
    })
  }

  const isMissedShift = (note?: string) => Boolean(note?.includes(MISSED_SHIFT_TAG))

  const markShiftMissed = (shift: (typeof shifts)[number]) => {
    if (isMissedShift(shift.note)) return
    const nextNote = shift.note?.trim()
      ? `${MISSED_SHIFT_TAG} ${shift.note.trim()}`
      : MISSED_SHIFT_TAG

    updateShift(shift.id, { note: nextNote })
    toast({
      title: "Marked as missed",
      description: "This shift is now flagged as missed.",
    })
  }

  const undoMissedShift = (shift: (typeof shifts)[number]) => {
    if (!isMissedShift(shift.note)) return
    const nextNote = shift.note
      ?.replace(MISSED_SHIFT_TAG, "")
      .trim()

    updateShift(shift.id, { note: nextNote || undefined })
    toast({
      title: "Missed flag removed",
      description: "This shift is no longer marked as missed.",
    })
  }

  const isDark = resolvedTheme === "dark"
  const axisColor = "var(--color-muted-foreground)"
  const gridColor = "var(--color-border)"
  const legendColor = "var(--color-muted-foreground)"
  const showQuickActions = widgetConfig.quickActions
  const shouldRenderSecondaryInsights = !isMobile || mobileInsightsOpen || showQuickActions
  const statCards = [
    { title: "This Week", value: `${stats.weekHours}h`, subtitle: formatCurrency(stats.weekEarnings, currencySymbol), icon: Clock },
    { title: "Monthly Earnings", value: formatCurrency(stats.monthEarnings, currencySymbol), subtitle: `${stats.monthHours}h worked`, icon: DollarSign },
    { title: "Monthly Spend", value: formatCurrency(stats.monthExpenses, currencySymbol), subtitle: `of ${formatCurrency(stats.totalBudgeted, currencySymbol)} budget`, icon: TrendingUp },
    { title: "Upcoming", value: `${stats.upcomingShifts.length}`, subtitle: "shifts scheduled", icon: CalendarClock },
  ]
  const visibleStatCards = statCards // Show all 4 on mobile for symmetry (2x2 grid)

  return (
    <div className="mobile-page flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          {isSpecialUser ? `Welcome ${displayName}` : "Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSpecialUser ? "Top shift priorities for today." : "Your shift overview at a glance."}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Plan: {planName}</Badge>
          {isSpecialUser ? (
            <Badge variant="outline" className="gap-1">
              <Heart className="size-3 text-rose-500" />
              Companion mode
            </Badge>
          ) : null}
          {!isPremium ? (
            <Badge variant="outline">
              {usage.shiftsThisMonth}/{limits.maxShiftsPerMonth} shifts
            </Badge>
          ) : null}
        </div>
      </div>

      {widgetConfig.stats ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {visibleStatCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              icon={card.icon}
              accent
            />
          ))}
        </div>
      ) : null}

      {isMobile && (widgetConfig.weeklyChart || widgetConfig.jobBreakdown || widgetConfig.profitability || showQuickActions) ? (
        <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-card to-muted/30 shadow-sm transition-all active:scale-[0.98]">
          <CardContent className="flex items-center justify-between p-4" onClick={() => setMobileInsightsOpen((prev) => !prev)}>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {mobileInsightsOpen ? <LayoutDashboard className="size-5" /> : <ChevronDown className="size-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-foreground">{mobileInsightsOpen ? "Collapse Dashboard" : "Expand Dashboard"}</p>
                <p className="truncate text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{mobileInsightsOpen ? "Hide extra tools" : "Quick tools & deep insights"}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-primary/20 bg-background px-3 text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm hover:bg-primary/5"
            >
              {mobileInsightsOpen ? "Hide" : "Expand"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {shouldRenderSecondaryInsights && (widgetConfig.weeklyChart || widgetConfig.jobBreakdown) ? (
        <DashboardChartInsights
          showWeeklyChart={widgetConfig.weeklyChart}
          showJobBreakdown={widgetConfig.jobBreakdown}
          hasShifts={hasShifts}
          weeklyChartData={weeklyChartData}
          currencySymbol={currencySymbol}
          jobPieData={jobPieData}
          isDark={isDark}
          axisColor={axisColor}
          gridColor={gridColor}
          legendColor={legendColor}
        />
      ) : null}

      {widgetConfig.upcomingShifts ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Upcoming Shifts</CardTitle>
            <Link href="/shifts" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.upcomingShifts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No upcoming shifts.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {stats.upcomingShifts.map((shift) => {
                  const job = getJob(shift.jobId)
                  const missed = isMissedShift(shift.note)
                  return (
                    <div key={shift.id} className="flex items-center gap-3 py-3">
                      <div className="size-2 shrink-0 rounded-full" style={{ background: job?.color || "#94a3b8" }} />
                      <div className="min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">{job?.name || "Unknown"}</span>
                          <Badge variant="secondary" className="h-4 px-1.5 py-0 text-[10px]">
                            {RATE_TYPE_LABELS[shift.rateType]}
                          </Badge>
                          {missed ? (
                            <Badge variant="destructive" className="h-4 px-1.5 py-0 text-[10px]">
                              Missed
                            </Badge>
                          ) : null}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(`${shift.date}T00:00:00`).toLocaleDateString("en-AU", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          &middot; {shift.startTime}&ndash;{shift.endTime} &middot; {shift.hours}h
                        </span>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-foreground">
                        {formatCurrency(shift.earnings, currencySymbol)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => {
                          if (missed) {
                            undoMissedShift(shift)
                            return
                          }
                          markShiftMissed(shift)
                        }}
                      >
                        {missed ? "Undo" : "Missed"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {shouldRenderSecondaryInsights && (showQuickActions || widgetConfig.profitability) ? (
        <div className="grid gap-4 lg:grid-cols-5">
          {showQuickActions ? (
            <Card className={widgetConfig.profitability ? "lg:col-span-3" : "lg:col-span-5"}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Plus className="size-4 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-0">
                <div className="rounded-xl border border-primary/10 bg-muted/20 p-4 shadow-sm active:shadow-md transition-shadow">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Quick Shift</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Job</Label>
                      <Select value={quickJobId} onValueChange={setQuickJobId}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select job" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobs.map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Hours</Label>
                      <Input value={quickHours} onChange={(e) => setQuickHours(e.target.value)} className="h-9" />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleQuickAddShift} disabled={!jobs.length} className="h-9 w-full gap-1.5">
                        <CalendarClock className="size-4" />
                        Add Shift
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/10 bg-muted/20 p-4 shadow-sm active:shadow-md transition-shadow">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Quick Expense</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label>Amount</Label>
                      <Input
                        value={quickExpenseAmount}
                        onChange={(e) => setQuickExpenseAmount(e.target.value)}
                        placeholder="0.00"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <Input
                        value={quickExpenseCategory}
                        onChange={(e) => setQuickExpenseCategory(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Input
                        value={quickExpenseDescription}
                        onChange={(e) => setQuickExpenseDescription(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleQuickAddExpense} variant="secondary" className="h-9 w-full gap-1.5">
                        <Receipt className="size-4" />
                        Add Expense
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {widgetConfig.profitability ? (
            <Card className={showQuickActions ? "lg:col-span-2" : "lg:col-span-5"}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <BriefcaseBusiness className="size-4 text-primary" />
                  Job Profitability (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {profitabilityRows.length ? (
                  <div className="space-y-2">
                    {profitabilityRows.map((row, index) => (
                      <div key={row.id} className="rounded-md border border-border/70 px-3 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{row.name}</span>
                              {index === 0 ? <Badge variant="secondary">Best net/hr</Badge> : null}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {row.shiftCount} shifts · {row.hours.toFixed(1)}h · Gross {formatCurrency(row.grossHourly, currencySymbol)}/h
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">{formatCurrency(row.netHourly, currencySymbol)}/h</p>
                            <p className="text-xs text-muted-foreground">Net hourly</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-sm text-muted-foreground">Add shifts to compare job profitability.</p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
