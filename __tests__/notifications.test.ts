import { describe, expect, it, vi, beforeEach } from "vitest"
import { checkGoalMilestones, checkEarningsMillestone } from "@/lib/notifications"

// Mock browser Notification API
const mockNotification = vi.fn()

describe("notifications", () => {
  beforeEach(() => {
    // Mock Notification constructor
    global.Notification = mockNotification as unknown as typeof Notification
    ;(global.Notification as { permission: NotificationPermission }).permission = "granted"
    mockNotification.mockClear()
  })

  describe("checkGoalMilestones", () => {
    it("triggers notification at 25% milestone", () => {
      checkGoalMilestones("Bali Trip", 250, 1000, 200)
      expect(mockNotification).toHaveBeenCalledTimes(1)
      expect(mockNotification).toHaveBeenCalledWith(
        "🎉 Goal Milestone Reached!",
        expect.objectContaining({
          body: expect.stringContaining("25%"),
        })
      )
    })

    it("triggers notification at 50% milestone", () => {
      checkGoalMilestones("Laptop Fund", 500, 1000, 400)
      expect(mockNotification).toHaveBeenCalledTimes(1)
      expect(mockNotification).toHaveBeenCalledWith(
        "🎉 Goal Milestone Reached!",
        expect.objectContaining({
          body: expect.stringContaining("50%"),
        })
      )
    })

    it("triggers notification at 75% milestone", () => {
      checkGoalMilestones("Car Savings", 750, 1000, 700)
      expect(mockNotification).toHaveBeenCalledTimes(1)
      expect(mockNotification).toHaveBeenCalledWith(
        "🎉 Goal Milestone Reached!",
        expect.objectContaining({
          body: expect.stringContaining("75%"),
        })
      )
    })

    it("triggers special notification at 100% milestone", () => {
      checkGoalMilestones("Holiday Fund", 1000, 1000, 950)
      expect(mockNotification).toHaveBeenCalledTimes(1)
      expect(mockNotification).toHaveBeenCalledWith(
        "🎉 Goal Milestone Reached!",
        expect.objectContaining({
          body: expect.stringContaining("100%"),
          requireInteraction: true,
        })
      )
    })

    it("does not trigger notification if no milestone crossed", () => {
      checkGoalMilestones("Savings", 230, 1000, 200)
      expect(mockNotification).not.toHaveBeenCalled()
    })

    it("does not trigger notification if going backwards", () => {
      checkGoalMilestones("Goal", 200, 1000, 300)
      expect(mockNotification).not.toHaveBeenCalled()
    })
  })

  describe("checkEarningsMillestone", () => {
    it("triggers notification at $500 milestone", () => {
      checkEarningsMillestone(500, 450, "this week")
      expect(mockNotification).toHaveBeenCalledTimes(1)
      expect(mockNotification).toHaveBeenCalledWith(
        "💰 Earnings Milestone!",
        expect.objectContaining({
          body: expect.stringContaining("$500"),
        })
      )
    })

    it("triggers notification at $1000 milestone", () => {
      checkEarningsMillestone(1050, 950, "this month")
      expect(mockNotification).toHaveBeenCalledTimes(1)
      expect(mockNotification).toHaveBeenCalledWith(
        "💰 Earnings Milestone!",
        expect.objectContaining({
          body: expect.stringContaining("$1,000"),
        })
      )
    })

    it("does not trigger if no milestone crossed", () => {
      checkEarningsMillestone(600, 550, "this week")
      expect(mockNotification).not.toHaveBeenCalled()
    })

    it("only shows one milestone even if multiple crossed", () => {
      checkEarningsMillestone(1500, 400, "this week")
      expect(mockNotification).toHaveBeenCalledTimes(1)
    })
  })
})
