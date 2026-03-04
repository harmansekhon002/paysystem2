"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Rectangle,
  type TooltipProps,
} from "recharts"

import { PieChart } from "@/components/ui/pie-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/store"

function CustomBarTooltip({
  active,
  payload,
  label,
  theme,
}: TooltipProps<number, string> & { theme: "light" | "dark" }) {
  if (!active || !payload || !payload.length) return null
  const isDark = theme === "dark"
  const bg = isDark ? "#111827" : "#fff"
  const color = isDark ? "#f9fafb" : "#111827"
  const titleColor = isDark ? "#22d3aa" : "#ea580c"
  const value = Number(payload[0]?.value ?? 0)
  return (
    <div
      style={{
        background: bg,
        color,
        border: "none",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 700,
        boxShadow: isDark ? "0 4px 16px 0 rgba(0,0,0,0.85)" : "0 2px 8px 0 rgba(0,0,0,0.08)",
        padding: "12px 18px",
        minWidth: 90,
        textAlign: "center",
        letterSpacing: "0.01em",
      }}
    >
      <div style={{ color: titleColor, fontWeight: 700 }}>{String(label ?? "")}</div>
      <div style={{ color, fontWeight: 700 }}>{`$${value}`}</div>
    </div>
  )
}

type ChartPoint = {
  day: string
  earnings: number
}

type PiePoint = {
  name: string
  value: number
  color: string
}

export function DashboardChartInsights({
  showWeeklyChart,
  showJobBreakdown,
  hasShifts,
  weeklyChartData,
  currencySymbol,
  jobPieData,
  isDark,
  axisColor,
  gridColor,
  legendColor,
}: {
  showWeeklyChart: boolean
  showJobBreakdown: boolean
  hasShifts: boolean
  weeklyChartData: ChartPoint[]
  currencySymbol: string
  jobPieData: PiePoint[]
  isDark: boolean
  axisColor: string
  gridColor: string
  legendColor: string
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {showWeeklyChart ? (
        <Card className={showJobBreakdown ? "lg:col-span-3" : "lg:col-span-5"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Weekly Earnings</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] pt-0">
            {hasShifts ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData} barSize={32} barCategoryGap={30} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: axisColor }} tickLine={false} axisLine={false} stroke={axisColor} />
                  <YAxis tick={{ fontSize: 12, fill: axisColor }} tickLine={false} axisLine={false} stroke={axisColor} tickFormatter={(v) => `${currencySymbol}${v}`} />
                  <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.12)", stroke: "transparent" }} content={<CustomBarTooltip theme={isDark ? "dark" : "light"} />} />
                  <Bar
                    dataKey="earnings"
                    fill="var(--color-primary)"
                    radius={[6, 6, 0, 0]}
                    stroke="transparent"
                    activeBar={<Rectangle stroke="var(--color-border)" strokeWidth={1} />}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Log a shift to see your weekly earnings.
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {showJobBreakdown ? (
        <Card className={showWeeklyChart ? "lg:col-span-2" : "lg:col-span-5"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">By Job</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pt-0">
            {jobPieData.length > 0 ? (
              <>
                <div className="h-[150px] w-[150px]">
                  <PieChart data={jobPieData} tooltipFormatter={(value) => [formatCurrency(Number(value), currencySymbol), "Earned"]} />
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {jobPieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs" style={{ color: legendColor }}>
                      <div className="size-2 rounded-full" style={{ background: entry.color }} />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-6 text-sm text-muted-foreground">No earnings yet.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
