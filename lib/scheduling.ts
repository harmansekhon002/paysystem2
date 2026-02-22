// Shift conflict detection and scheduling utilities

import { type Shift } from "./store"

export interface ShiftConflict {
  shift1: Shift
  shift2: Shift
  type: "overlap" | "same-time" | "back-to-back"
  minutesOverlap?: number
}

export interface TimeSlot {
  startMinutes: number
  endMinutes: number
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

export function getTimeSlot(shift: Shift): TimeSlot {
  return {
    startMinutes: timeToMinutes(shift.startTime),
    endMinutes: timeToMinutes(shift.endTime),
  }
}

export function doTimeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  return slot1.startMinutes < slot2.endMinutes && slot2.startMinutes < slot1.endMinutes
}

export function getOverlapMinutes(slot1: TimeSlot, slot2: TimeSlot): number {
  if (!doTimeSlotsOverlap(slot1, slot2)) return 0

  const overlapStart = Math.max(slot1.startMinutes, slot2.startMinutes)
  const overlapEnd = Math.min(slot1.endMinutes, slot2.endMinutes)
  return overlapEnd - overlapStart
}

export function findShiftConflicts(shifts: Shift[]): ShiftConflict[] {
  const conflicts: ShiftConflict[] = []

  for (let i = 0; i < shifts.length; i++) {
    for (let j = i + 1; j < shifts.length; j++) {
      const shift1 = shifts[i]
      const shift2 = shifts[j]

      // Only check shifts on the same date
      if (shift1.date !== shift2.date) continue

      const slot1 = getTimeSlot(shift1)
      const slot2 = getTimeSlot(shift2)

      // Check for exact same time
      if (slot1.startMinutes === slot2.startMinutes && slot1.endMinutes === slot2.endMinutes) {
        conflicts.push({
          shift1,
          shift2,
          type: "same-time",
          minutesOverlap: slot1.endMinutes - slot1.startMinutes,
        })
        continue
      }

      // Check for overlap
      const overlap = getOverlapMinutes(slot1, slot2)
      if (overlap > 0) {
        conflicts.push({
          shift1,
          shift2,
          type: "overlap",
          minutesOverlap: overlap,
        })
        continue
      }

      // Check for back-to-back (less than 30 min between)
      const gap = Math.min(
        Math.abs(slot1.endMinutes - slot2.startMinutes),
        Math.abs(slot2.endMinutes - slot1.startMinutes)
      )
      if (gap <= 30) {
        conflicts.push({
          shift1,
          shift2,
          type: "back-to-back",
        })
      }
    }
  }

  return conflicts
}

export function canScheduleShift(shift: Partial<Shift>, existingShifts: Shift[]): { canSchedule: boolean; conflicts: ShiftConflict[] } {
  if (!shift.date || !shift.startTime || !shift.endTime) {
    return { canSchedule: false, conflicts: [] }
  }

  const tempShift: Shift = {
    id: "temp",
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    jobId: shift.jobId || "",
    rateType: shift.rateType || "weekday",
    breakMinutes: shift.breakMinutes || 0,
    hours: shift.hours || 0,
    earnings: shift.earnings || 0,
  }

  const conflicts = findShiftConflicts([...existingShifts, tempShift]).filter(
    conflict => conflict.shift1.id === "temp" || conflict.shift2.id === "temp"
  )

  return {
    canSchedule: conflicts.length === 0,
    conflicts,
  }
}

// Scheduling suggestions
export interface ScheduleSuggestion {
  date: string
  startTime: string
  endTime: string
  reason: string
}

export function suggestOptimalShifts(
  existingShifts: Shift[],
  preferredDuration: number = 8,
  preferredDays: number[] = [1, 2, 3, 4, 5] // Mon-Fri
): ScheduleSuggestion[] {
  const suggestions: ScheduleSuggestion[] = []
  const today = new Date()

  // Look ahead 7 days
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + dayOffset)
    const dateStr = targetDate.toISOString().split("T")[0]
    const dayOfWeek = targetDate.getDay()

    // Skip if not preferred day
    if (!preferredDays.includes(dayOfWeek)) continue

    // Check if date already has shifts
    const shiftsOnDate = existingShifts.filter(s => s.date === dateStr)
    if (shiftsOnDate.length > 0) continue

    // Suggest morning shift
    suggestions.push({
      date: dateStr,
      startTime: "09:00",
      endTime: minutesToTime(9 * 60 + preferredDuration * 60),
      reason: "Available morning slot",
    })

    // Suggest afternoon shift
    suggestions.push({
      date: dateStr,
      startTime: "14:00",
      endTime: minutesToTime(14 * 60 + preferredDuration * 60),
      reason: "Available afternoon slot",
    })
  }

  return suggestions.slice(0, 5) // Return top 5 suggestions
}
