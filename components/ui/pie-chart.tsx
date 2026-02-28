
"use client"

import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { type TooltipProps } from "recharts"
import { useTheme } from "next-themes"
// Custom tooltip content to ensure all text is visible in both themes
function CustomPieTooltip({
  active,
  payload,
  theme,
  formatter,
}: TooltipProps<number, string> & {
  theme: "light" | "dark"
  formatter?: (value: number, name: string) => [string, string]
}) {
  if (!active || !payload || !payload.length) return null;
  const isDark = theme === 'dark';
  const bg = isDark ? '#111827' : '#fff';
  const color = isDark ? '#f9fafb' : '#111827';
  // Use theme green for title
  const titleColor = isDark ? '#22d3aa' : '#059669';
  const numericValue = Number(payload[0]?.value ?? 0)
  const name = String(payload[0]?.name ?? "")
  const formatted = formatter ? formatter(numericValue, name) : [String(numericValue), name]
  const displayValue = formatted[0]
  return (
    <div
      style={{
        background: bg,
        color,
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 700,
        boxShadow: isDark ? '0 4px 16px 0 rgba(0,0,0,0.85)' : '0 2px 8px 0 rgba(0,0,0,0.08)',
        padding: '12px 18px',
        minWidth: 90,
        textAlign: 'center',
        letterSpacing: '0.01em',
      }}
    >
      <div style={{ color: titleColor, fontWeight: 700 }}>{name}</div>
      <div style={{ color, fontWeight: 700 }}>{displayValue}</div>
    </div>
  );
}

export interface PieChartData {
  name: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieChartData[]
  tooltipFormatter?: (value: number, name: string) => [string, string]
  height?: number
  outerRadius?: number
  innerRadius?: number
}

export function PieChart({
  data,
  tooltipFormatter = (value, name) => [String(value), name],
  height = 150,
  outerRadius = 65,
  innerRadius = 0,
}: PieChartProps) {
  // Use app theme context for tooltip colors
  const { resolvedTheme } = useTheme();
  // Force re-render on theme change
  return (
    <div style={{ height, width: height }} key={resolvedTheme}>
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            stroke="hsl(var(--border) / 0.35)"
            strokeWidth={2}
            label={false}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={tooltipFormatter}
            content={
              <CustomPieTooltip
                theme={resolvedTheme === "dark" ? "dark" : "light"}
                formatter={tooltipFormatter}
              />
            }
          />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  )
}
