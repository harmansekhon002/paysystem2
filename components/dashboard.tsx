"use client"

import { useMemo, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppData } from "@/components/data-provider"
import { formatCurrency, RATE_TYPE_LABELS } from "@/lib/store"
import { Clock, DollarSign, TrendingUp, CalendarClock, ArrowRight } from "lucide-react"
import Link from "next/link"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts"

function StatCard({
  title, value, subtitle, icon: Icon, accent = false,
}: {
  title: string; value: string; subtitle: string; icon: React.ElementType; accent?: boolean
}) {
  // Only apply green glow on hover if accent is true
  return (
    <Card
      className={accent
        ?
          // Remove always-on accent, add green ring only on hover
          'transition-shadow hover:shadow-[0_0_0_3px_rgba(16,185,129,0.5)]'
        : ''}
    >
      <CardContent className="flex items-start justify-between p-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-xl bg-secondary`}>
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const { data, getJob } = useAppData()
  const { shifts, jobs, expenses, budgetCategories } = data
  const currencySymbol = data.settings.currencySymbol
  const hasShifts = shifts.length > 0

  const stats = useMemo(() => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    const thisWeekStr = monday.toISOString().split("T")[0]

    const weekShifts = shifts.filter(s => s.date >= thisWeekStr)
    const weekHours = weekShifts.reduce((sum, s) => sum + s.hours, 0)
    const weekEarnings = weekShifts.reduce((sum, s) => sum + s.earnings, 0)

    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
    const monthShifts = shifts.filter(s => s.date >= monthStart)
    const monthEarnings = monthShifts.reduce((sum, s) => sum + s.earnings, 0)
    const monthHours = monthShifts.reduce((sum, s) => sum + s.hours, 0)

    const monthExpenses = expenses
      .filter(e => e.date >= monthStart)
      .reduce((sum, e) => sum + e.amount, 0)

    const totalBudgeted = budgetCategories.reduce((sum, c) => sum + c.budgeted, 0)

    const todayStr = now.toISOString().split("T")[0]
    const upcomingShifts = shifts
      .filter(s => s.date >= todayStr)
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
      const dayShifts = shifts.filter(s => s.date === dateStr)
      const earnings = dayShifts.reduce((sum, s) => sum + s.earnings, 0)
      return { day: label, earnings: Math.round(earnings * 100) / 100 }
    })
  }, [shifts])

  const jobPieData = useMemo(() => {
    const byJob: Record<string, number> = {}
    shifts.forEach(s => {
      const job = getJob(s.jobId)
      if (job) byJob[job.name] = (byJob[job.name] || 0) + s.earnings
    })
    return Object.entries(byJob).map(([name, value]) => {
      const job = jobs.find(j => j.name === name)
      return { name, value: Math.round(value * 100) / 100, color: job?.color || "#94a3b8" }
    })
  }, [shifts, jobs, getJob])

  // Color helpers for dark mode (avoid SSR mismatch)
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
      const listener = (e) => setIsDark(e.matches)
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }
  }, [])
  const axisColor = isDark ? '#888' : '#222'
  const gridColor = isDark ? '#888' : 'var(--color-border)'
  const legendColor = isDark ? '#888' : '#222'
  const tooltipBg = isDark ? '#222' : '#fff'
  const tooltipColor = isDark ? '#fff' : '#222'
  const tooltipBorder = '1px solid var(--color-border)'
  const tooltipRadius = '8px'
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your shift overview at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="This Week" value={`${stats.weekHours}h`} subtitle={formatCurrency(stats.weekEarnings, currencySymbol)} icon={Clock} accent />
        <StatCard title="Monthly Earnings" value={formatCurrency(stats.monthEarnings, currencySymbol)} subtitle={`${stats.monthHours}h worked`} icon={DollarSign} accent />
        <StatCard title="Monthly Spend" value={formatCurrency(stats.monthExpenses, currencySymbol)} subtitle={`of ${formatCurrency(stats.totalBudgeted, currencySymbol)} budget`} icon={TrendingUp} accent />
        <StatCard title="Upcoming" value={`${stats.upcomingShifts.length}`} subtitle="shifts scheduled" icon={CalendarClock} accent />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Weekly Earnings</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] pt-0">
            {hasShifts ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: axisColor }} tickLine={false} axisLine={false} stroke={axisColor} />
                  <YAxis tick={{ fontSize: 12, fill: axisColor }} tickLine={false} axisLine={false} stroke={axisColor} tickFormatter={(v) => `${currencySymbol}${v}`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value, currencySymbol), "Earnings"]}
                    contentStyle={{ background: tooltipBg, color: tooltipColor, border: tooltipBorder, borderRadius: tooltipRadius, fontSize: "13px" }}
                  />
                  <Bar dataKey="earnings" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Log a shift to see your weekly earnings.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">By Job</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pt-0">
            {jobPieData.length > 0 ? (
              <>
                <div className="h-[150px] w-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={jobPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={2} stroke={axisColor}>
                        {jobPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatCurrency(value, currencySymbol), "Earned"]} contentStyle={{ background: tooltipBg, color: tooltipColor, border: tooltipBorder, borderRadius: tooltipRadius, fontSize: "13px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {jobPieData.map((e) => (
                    <div key={e.name} className="flex items-center gap-1.5 text-xs" style={{ color: legendColor }}>
                      <div className="size-2 rounded-full" style={{ background: e.color }} />
                      {e.name}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-6 text-sm text-muted-foreground">No earnings yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming shifts */}
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
                return (
                  <div key={shift.id} className="flex items-center gap-3 py-3">
                    <div className="size-2 rounded-full shrink-0" style={{ background: job?.color || "#94a3b8" }} />
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{job?.name || "Unknown"}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{RATE_TYPE_LABELS[shift.rateType]}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(shift.date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", month: "short", day: "numeric" })} &middot; {shift.startTime}&ndash;{shift.endTime} &middot; {shift.hours}h
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground shrink-0">{formatCurrency(shift.earnings, currencySymbol)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
