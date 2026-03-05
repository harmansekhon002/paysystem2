"use client"

import { useMemo } from "react"
import { useAppData } from "@/components/data-provider"
import { differenceInDays, addDays, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns"

export function useWorkLimits() {
    const { data } = useAppData()
    const { workHourLimits, timeZone } = data.settings
    const { shifts } = data

    return useMemo(() => {
        if (!workHourLimits?.enabled) {
            return { enabled: false }
        }

        const now = new Date()
        const anchorDate = parseISO(workHourLimits.cycleStart)
        const cycleDays = workHourLimits.cycleDays || 14

        // Calculate how many full cycles have passed since the anchor
        const daysSinceAnchor = differenceInDays(now, anchorDate)
        const cyclesPassed = Math.floor(daysSinceAnchor / cycleDays)

        // Calculate the start and end of the current cycle
        const currentCycleStart = addDays(anchorDate, cyclesPassed * cycleDays)
        const currentCycleEnd = addDays(currentCycleStart, cycleDays - 1)

        // Sum hours of shifts within this cycle
        const workedHours = shifts.reduce((total, shift) => {
            const shiftDate = parseISO(shift.date)
            if (isWithinInterval(shiftDate, {
                start: startOfDay(currentCycleStart),
                end: endOfDay(currentCycleEnd)
            })) {
                return total + shift.hours
            }
            return total
        }, 0)

        const remainingHours = Math.max(0, workHourLimits.maxHours - workedHours)
        const percent = Math.min(100, (workedHours / workHourLimits.maxHours) * 100)
        const isOverLimit = workedHours > workHourLimits.maxHours

        return {
            enabled: true,
            workedHours,
            remainingHours,
            maxHours: workHourLimits.maxHours,
            percent,
            isOverLimit,
            cycleStart: currentCycleStart,
            cycleEnd: currentCycleEnd,
            daysRemaining: differenceInDays(currentCycleEnd, now) + 1
        }
    }, [shifts, workHourLimits, timeZone])
}
