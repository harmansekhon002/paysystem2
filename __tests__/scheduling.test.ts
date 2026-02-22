import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  findShiftConflicts,
  canScheduleShift,
  suggestOptimalShifts,
} from "../lib/scheduling"
import { type Shift } from "../lib/store"

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-02-22T00:00:00Z"))
})

afterEach(() => {
  vi.useRealTimers()
})

describe("Shift Conflict Detection", () => {
  const shifts: Shift[] = [
    {
      id: "1",
      jobId: "job1",
      date: "2026-02-23",
      startTime: "09:00",
      endTime: "17:00",
      hours: 8,
      rateType: "weekday",
      breakMinutes: 0,
      earnings: 200,
    },
    {
      id: "2",
      jobId: "job2",
      date: "2026-02-23",
      startTime: "15:00",
      endTime: "20:00",
      hours: 5,
      rateType: "weekday",
      breakMinutes: 0,
      earnings: 150,
    },
    {
      id: "3",
      jobId: "job1",
      date: "2026-02-23",
      startTime: "20:15",
      endTime: "23:00",
      hours: 2.75,
      rateType: "weekday",
      breakMinutes: 0,
      earnings: 96.25,
    },
  ]

  it("should detect overlapping shifts", () => {
    const conflicts = findShiftConflicts(shifts)
    
    // Shift 1 (09:00-17:00) overlaps with Shift 2 (15:00-20:00)
    const overlap = conflicts.find(
      c => c.type === "overlap" && 
      ((c.shift1.id === "1" && c.shift2.id === "2") || 
       (c.shift1.id === "2" && c.shift2.id === "1"))
    )
    
    expect(overlap).toBeDefined()
    expect(overlap?.minutesOverlap).toBe(120) // 2 hours overlap
  })

  it("should detect back-to-back shifts with short gap", () => {
    const conflicts = findShiftConflicts(shifts)
    
    // Shift 2 (15:00-20:00) and Shift 3 (20:15-23:00) are back-to-back with 15min gap
    const backToBack = conflicts.find(
      c => c.type === "back-to-back" && 
      ((c.shift1.id === "2" && c.shift2.id === "3") || 
       (c.shift1.id === "3" && c.shift2.id === "2"))
    )
    
    expect(backToBack).toBeDefined()
  })

  it("should not conflict with shifts on different days", () => {
    const differentDay: Shift = {
      id: "4",
      jobId: "job1",
      date: "2024-03-16",
      startTime: "09:00",
      endTime: "17:00",
      hours: 8,
      rateType: "weekday",
      breakMinutes: 0,
      earnings: 200,
    }

    const conflicts = findShiftConflicts([...shifts, differentDay])
    const hasConflictWithDifferentDay = conflicts.some(
      c => c.shift1.id === "4" || c.shift2.id === "4"
    )
    
    expect(hasConflictWithDifferentDay).toBe(false)
  })
})

describe("Shift Scheduling", () => {
  const existingShifts: Shift[] = [
    {
      id: "1",
      jobId: "job1",
      date: "2026-02-23",
      startTime: "09:00",
      endTime: "17:00",
      hours: 8,
      rateType: "weekday",
      breakMinutes: 0,
      earnings: 200,
    },
  ]

  it("should allow scheduling non-conflicting shift", () => {
    const newShift: Shift = {
      id: "2",
      jobId: "job2",
      date: "2026-02-23",
      startTime: "18:00",
      endTime: "22:00",
      hours: 4,
      rateType: "weekday",
      breakMinutes: 0,
      earnings: 140,
    }

    const result = canScheduleShift(newShift, existingShifts)
    expect(result.canSchedule).toBe(true)
    expect(result.conflicts).toHaveLength(0)
  })

  it("should prevent scheduling conflicting shift", () => {
    const newShift: Shift = {
      id: "2",
      jobId: "job2",
      date: "2026-02-23",
      startTime: "15:00",
      endTime: "20:00",
      hours: 5,
      rateType: "weekday",
      breakMinutes: 0,
      earnings: 150,
    }

    const result = canScheduleShift(newShift, existingShifts)
    expect(result.canSchedule).toBe(false)
    expect(result.conflicts.length).toBeGreaterThan(0)
  })
})

describe("Optimal Shift Suggestions", () => {
  const existingShifts: Shift[] = [
    {
      id: "1",
      jobId: "job1",
      date: "2026-02-23",
      startTime: "09:00",
      endTime: "17:00",
      hours: 8,
      rateType: "weekday",
      breakMinutes: 0,
      earnings: 200,
    },
  ]

  it("should suggest available time slots", () => {
    const suggestions = suggestOptimalShifts(existingShifts)
    
    expect(suggestions.length).toBeGreaterThan(0)
    
    // Should suggest slots that don't conflict with existing shifts
    const conflictingSuggestion = suggestions.find(s => 
      s.date === "2026-02-23" && s.startTime === "09:00"
    )
    expect(conflictingSuggestion).toBeUndefined()
  })

  it("should prioritize weekend shifts", () => {
    const suggestions = suggestOptimalShifts(existingShifts, 8, [0, 6])
    
    expect(suggestions.length).toBeGreaterThan(0)
    const nonWeekend = suggestions.find(s => {
      const day = new Date(s.date).getDay()
      return day !== 0 && day !== 6
    })
    expect(nonWeekend).toBeUndefined()
  })

  it("should honor preferred shift duration", () => {
    const preferredDuration = 5
    const suggestions = suggestOptimalShifts(existingShifts, preferredDuration)

    for (const suggestion of suggestions) {
      const durationHours = (timeToMinutes(suggestion.endTime) - timeToMinutes(suggestion.startTime)) / 60
      expect(durationHours).toBe(preferredDuration)
    }
  })
})
