import { describe, expect, it } from "vitest"
import { calculateShiftHours, calculateShiftEarnings, detectRateType, formatAUD } from "@/lib/store"

describe("store helpers", () => {
  it("calculates shift hours with breaks", () => {
    expect(calculateShiftHours("09:00", "17:00", 30)).toBe(7.5)
  })

  it("calculates shift earnings using rates", () => {
    const job = {
      id: "j",
      name: "Test Job",
      category: "custom" as const,
      baseRate: 20,
      rates: {
        weekday: 20,
        saturday: 30,
        sunday: 40,
        public_holiday: 50,
        overtime: 35,
      },
      color: "#000000",
    }
    expect(calculateShiftEarnings(4, job, "weekday")).toBe(80)
    expect(calculateShiftEarnings(2.5, job, "saturday")).toBe(75)
  })

  it("detects weekend and public holiday rate types", () => {
    expect(detectRateType("2026-02-21", [])).toBe("saturday")
    expect(detectRateType("2026-02-22", [])).toBe("sunday")
    expect(detectRateType("2026-12-25", ["2026-12-25"])).toBe("public_holiday")
  })

  it("formats AUD consistently", () => {
    expect(formatAUD(0)).toBe("$0.00")
    expect(formatAUD(12.5)).toBe("$12.50")
  })
})
