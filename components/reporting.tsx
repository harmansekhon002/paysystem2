"use client"

import { useMemo } from "react"
import { TrendingUp, TrendingDown, Calendar, DollarSign, Clock, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAppData } from "@/components/data-provider"
import { formatCurrency, type RateType, RATE_TYPE_LABELS } from "@/lib/store"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { PieChart } from "@/components/ui/pie-chart"
import { useState } from "react"

export function ReportingDashboard() {
  const { data } = useAppData()
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter" | "year">("month")
  const currencySymbol = data.settings.currencySymbol

  // Calculate date ranges
  const now = useMemo(() => new Date(), [])
  const ranges = {
    week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
  }
  const startDate = ranges[timeRange].toISOString().split("T")[0]

  // Filter data by time range
  const filteredShifts = useMemo(() => {
    return data.shifts.filter(s => s.date >= startDate)
  }, [data.shifts, startDate])

  const filteredExpenses = useMemo(() => {
    return data.expenses.filter(e => e.date >= startDate)
  }, [data.expenses, startDate])

  // Earnings analytics
  const totalEarnings = filteredShifts.reduce((sum, s) => sum + s.earnings, 0)
  const totalHours = filteredShifts.reduce((sum, s) => sum + s.hours, 0)
  const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  const netIncome = totalEarnings - totalExpenses

  // Trend comparison (vs previous period)
  const periodDays = Math.ceil((now.getTime() - ranges[timeRange].getTime()) / 86400000)
  const prevStartDate = new Date(ranges[timeRange].getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const prevShifts = data.shifts.filter(s => s.date >= prevStartDate && s.date < startDate)
  const prevEarnings = prevShifts.reduce((sum, s) => sum + s.earnings, 0)
  const earningsTrend = prevEarnings > 0 ? ((totalEarnings - prevEarnings) / prevEarnings) * 100 : 0

  // Earnings by job
  const earningsByJob = useMemo(() => {
    const jobMap = new Map<string, { name: string; earnings: number; hours: number; color: string }>()
    filteredShifts.forEach(shift => {
      const job = data.jobs.find(j => j.id === shift.jobId)
      if (!job) return
      const existing = jobMap.get(shift.jobId) || { name: job.name, earnings: 0, hours: 0, color: job.color }
      existing.earnings += shift.earnings
      existing.hours += shift.hours
      jobMap.set(shift.jobId, existing)
    })
    return Array.from(jobMap.values()).sort((a, b) => b.earnings - a.earnings)
  }, [filteredShifts, data.jobs])

  // Earnings by rate type
  const earningsByRateType = useMemo(() => {
    const rateMap = new Map<RateType, number>()
    filteredShifts.forEach(shift => {
      rateMap.set(shift.rateType, (rateMap.get(shift.rateType) || 0) + shift.earnings)
    })
    return Array.from(rateMap.entries())
      .map(([rateType, earnings]) => ({ rateType: RATE_TYPE_LABELS[rateType], earnings }))
      .sort((a, b) => b.earnings - a.earnings)
  }, [filteredShifts])

  // Daily earnings trend
  const dailyEarnings = useMemo(() => {
    const dailyMap = new Map<string, number>()
    filteredShifts.forEach(shift => {
      dailyMap.set(shift.date, (dailyMap.get(shift.date) || 0) + shift.earnings)
    })
    return Array.from(dailyMap.entries())
      .map(([date, earnings]) => ({ date, earnings }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredShifts])

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    const catMap = new Map<string, number>()
    filteredExpenses.forEach(expense => {
      catMap.set(expense.category, (catMap.get(expense.category) || 0) + expense.amount)
    })
    return Array.from(catMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredExpenses])

  // Goal progress analytics
  const goalsProgress = useMemo(() => {
    return data.goals.map(goal => ({
      name: goal.name,
      progress: Math.min(100, (goal.currentAmount / goal.targetAmount) * 100),
      current: goal.currentAmount,
      target: goal.targetAmount,
      daysLeft: Math.ceil((new Date(goal.deadline).getTime() - now.getTime()) / 86400000),
    }))
  }, [data.goals, now])

  const COLORS = ["#0d9488", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"]

  // Color helpers for dark mode
  const isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  const axisColor = isDark ? '#888' : '#222'
  const gridColor = isDark ? '#888' : 'hsl(var(--border))'
  const legendColor = isDark ? '#888' : '#222'
  const tooltipBg = isDark ? '#222' : '#fff'
  const tooltipColor = isDark ? '#fff' : '#222'
  const tooltipBorder = '1px solid var(--color-border)'
  const tooltipRadius = '8px'
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Advanced insights and trends.</p>
        </div>
        <Select value={timeRange} onValueChange={v => setTimeRange(v as typeof timeRange)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Total Earnings</span>
                <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrency(totalEarnings, currencySymbol)}</p>
              </div>
              <DollarSign className="size-8 text-primary/30" />
            </div>
            <div className="mt-2 flex items-center gap-1">
              {earningsTrend >= 0 ? (
                <TrendingUp className="size-3 text-green-600" />
              ) : (
                <TrendingDown className="size-3 text-red-600" />
              )}
              <span className={`text-xs ${earningsTrend >= 0 ? "text-green-600" : "text-red-600"}`}>
                {Math.abs(earningsTrend).toFixed(1)}% vs prev period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Total Hours</span>
                <p className="mt-1 text-xl font-semibold text-foreground">{totalHours.toFixed(1)}h</p>
              </div>
              <Clock className="size-8 text-primary/30" />
            </div>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">{filteredShifts.length} shifts logged</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Avg Hourly</span>
                <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrency(avgHourlyRate, currencySymbol)}/h</p>
              </div>
              <Target className="size-8 text-primary/30" />
            </div>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">Across all jobs</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Net Income</span>
                <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrency(netIncome, currencySymbol)}</p>
              </div>
              <Calendar className="size-8 text-primary/30" />
            </div>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">After {formatCurrency(totalExpenses, currencySymbol)} expenses</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Earnings Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Earnings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyEarnings.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={dailyEarnings}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="date"
                    stroke={axisColor}
                    fontSize={11}
                    tick={{ fontSize: 11, fill: axisColor }}
                    tickFormatter={date => new Date(date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                  />
                  <YAxis stroke={axisColor} fontSize={11} tick={{ fontSize: 11, fill: axisColor }} />
                  <Tooltip
                    contentStyle={{ background: tooltipBg, color: tooltipColor, border: tooltipBorder, borderRadius: tooltipRadius, fontSize: "13px" }}
                    formatter={(value: number) => formatCurrency(value, currencySymbol)}
                  />
                  <Line type="monotone" dataKey="earnings" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">No data for this period</p>
            )}
          </CardContent>
        </Card>

        {/* Earnings by Job */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Earnings by Workplace</CardTitle>
          </CardHeader>
          <CardContent>
            {earningsByJob.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={earningsByJob}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" stroke={axisColor} fontSize={11} tick={{ fontSize: 11, fill: axisColor }} />
                  <YAxis stroke={axisColor} fontSize={11} tick={{ fontSize: 11, fill: axisColor }} />
                  <Tooltip
                    contentStyle={{ background: tooltipBg, color: tooltipColor, border: tooltipBorder, borderRadius: tooltipRadius, fontSize: "13px" }}
                    formatter={(value: number) => formatCurrency(value, currencySymbol)}
                  />
                  <Bar dataKey="earnings">
                    {earningsByJob.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">No data for this period</p>
            )}
          </CardContent>
        </Card>

        {/* Rate Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Earnings by Rate Type</CardTitle>
          </CardHeader>
          <CardContent>
            {earningsByRateType.length > 0 ? (
              <PieChart
                data={earningsByRateType.map((item, index) => ({
                  name: item.rateType,
                  value: item.earnings,
                  color: COLORS[index % COLORS.length],
                }))}
                tooltipFormatter={(value, name) => [formatCurrency(value, currencySymbol), name]}
                height={200}
              />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">No data for this period</p>
            )}
          </CardContent>
        </Card>

        {/* Expenses Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length > 0 ? (
              <div className="flex flex-col gap-2">
                {expensesByCategory.map((item, index) => {
                  const percent = (item.amount / totalExpenses) * 100
                  return (
                    <div key={item.category} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs" style={{ color: legendColor }}>{item.category}</span>
                          <span className="text-xs font-medium" style={{ color: legendColor }}>{formatCurrency(item.amount, currencySymbol)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percent}%`,
                              background: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">No expenses for this period</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      {goalsProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Goals Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {goalsProgress.map((goal) => (
                <div key={goal.name} className="flex flex-col gap-2 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{goal.name}</span>
                    <Badge variant={goal.progress >= 100 ? "default" : goal.daysLeft < 0 ? "destructive" : "secondary"}>
                      {goal.progress >= 100 ? "Complete" : goal.daysLeft < 0 ? "Overdue" : `${goal.daysLeft}d left`}
                    </Badge>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, goal.progress)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(goal.current, currencySymbol)}</span>
                    <span>{goal.progress.toFixed(1)}%</span>
                    <span>{formatCurrency(goal.target, currencySymbol)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
