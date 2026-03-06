"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Shift, JobTemplate } from "@/lib/store"

interface ShiftCalendarViewProps {
    calMonth: Date
    setCalMonth: React.Dispatch<React.SetStateAction<Date>>
    calDays: { days: Date[]; offset: number }
    shiftsByDate: Map<string, Shift[]>
    todayStr: string
    publicHolidays: string[]
    jobsById: Map<string, JobTemplate>
    calMonthLabel: string
}

export function ShiftCalendarView({
    setCalMonth,
    calDays,
    shiftsByDate,
    todayStr,
    publicHolidays,
    jobsById,
    calMonthLabel,
}: ShiftCalendarViewProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{calMonthLabel}</CardTitle>
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>Prev</Button>
                    <Button variant="ghost" size="sm" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>Next</Button>
                </div>
            </CardHeader>
            <CardContent className="pt-0 px-2 sm:px-6">
                <div className="overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="grid grid-cols-7 gap-1 min-w-[320px]">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                            <div key={d} className="p-1 text-center text-[10px] sm:text-[11px] font-medium text-muted-foreground">{d}</div>
                        ))}
                        {Array.from({ length: calDays.offset }).map((_, i) => <div key={`e${i}`} />)}
                        {calDays.days.map(day => {
                            const dayStr = day.toISOString().split("T")[0]
                            const dayShifts = shiftsByDate.get(dayStr) ?? []
                            const isToday = dayStr === todayStr
                            const isPH = publicHolidays.includes(dayStr)
                            return (
                                <div
                                    key={dayStr}
                                    className={`relative flex min-h-[3.2rem] sm:min-h-[3.5rem] flex-col items-center rounded-lg p-1 text-xs transition-colors ${isToday ? "bg-primary/10 ring-1 ring-primary/30"
                                        : isPH ? "bg-destructive/5"
                                            : "hover:bg-secondary/50"
                                        }`}
                                >
                                    <span className={`font-medium text-[10px] sm:text-xs ${isToday ? "text-primary" : isPH ? "text-destructive" : "text-foreground"}`}>
                                        {day.getDate()}
                                    </span>
                                    {dayShifts.length > 0 && (
                                        <div className="mt-0.5 flex flex-col items-center gap-0.5">
                                            <div className="flex gap-0.5">
                                                {dayShifts.slice(0, 3).map(s => {
                                                    const j = jobsById.get(s.jobId)
                                                    return <div key={s.id} className="size-1 sm:size-1.5 rounded-full" style={{ background: j?.color || "#94a3b8" }} />
                                                })}
                                            </div>
                                            <span className="text-[8px] sm:text-[9px] text-muted-foreground leading-none">
                                                {dayShifts.reduce((s, sh) => s + sh.hours, 0)}h
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
