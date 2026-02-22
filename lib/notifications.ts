"use client"

// Browser notification system for milestone alerts

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      ...options,
    })
  }
}

export function checkGoalMilestones(
  goalName: string,
  currentAmount: number,
  targetAmount: number,
  previousAmount: number
): void {
  const currentPercent = (currentAmount / targetAmount) * 100
  const previousPercent = (previousAmount / targetAmount) * 100

  // Check for milestone crossings (25%, 50%, 75%, 100%)
  const milestones = [25, 50, 75, 100]
  
  for (const milestone of milestones) {
    if (previousPercent < milestone && currentPercent >= milestone) {
      showNotification(
        `🎉 Goal Milestone Reached!`,
        {
          body: `You&apos;ve reached ${milestone}% of your "${goalName}" goal! ${milestone === 100 ? "Congratulations on completing your goal! 🎊" : "Keep going!"}`,
          tag: `goal-${goalName}-${milestone}`,
          requireInteraction: milestone === 100,
        }
      )
      break // Only show one milestone per update
    }
  }
}

export function checkEarningsMillestone(
  totalEarnings: number,
  previousEarnings: number,
  period: string = "this week"
): void {
  const milestones = [500, 1000, 2000, 5000, 10000]
  
  for (const milestone of milestones) {
    if (previousEarnings < milestone && totalEarnings >= milestone) {
      showNotification(
        `💰 Earnings Milestone!`,
        {
          body: `You&apos;ve earned $${milestone.toLocaleString()} ${period}! Great work!`,
          tag: `earnings-${milestone}`,
        }
      )
      break
    }
  }
}
