
"use client"

import { useState, useEffect } from "react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { format, parseISO, subDays } from "date-fns"

export function AiUsageChart() {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchUsage = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/ai-stats")
            if (res.ok) {
                const rawData = await res.json()
                setData(rawData)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsage()
    }, [])

    if (loading) return <div className="h-[300px] flex items-center justify-center">Loading chart...</div>

    return (
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                        dataKey="date"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => format(parseISO(val), "MMM d")}
                    />
                    <YAxis
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px"
                        }}
                        labelFormatter={(label) => format(parseISO(label), "MMMM d, yyyy")}
                    />
                    <Line
                        type="monotone"
                        dataKey="calls"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
