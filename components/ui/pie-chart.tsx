import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

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
  return (
    <div style={{ height, width: height }}>
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
            stroke="#fff"
            strokeWidth={2}
            label={false}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={tooltipFormatter} contentStyle={{ background: '#222', color: '#fff', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '13px' }} />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  )
}
