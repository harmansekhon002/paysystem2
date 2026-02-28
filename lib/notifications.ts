"use client"

import type { AppData } from "@/lib/store"

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "shift"
  | "budget"
  | "goal"
  | "earnings"
  | "payday"
  | "motivation"
  | "milestone"

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  body: string
  emoji: string
  timestamp: Date
  read: boolean
  link?: string
}

// ─── Motivational Quotes ──────────────────────────────────────────────────────

const MOTIVATION_QUOTES = [
  { quote: "Every shift brings you closer to your goal.", author: "ShiftWise" },
  { quote: "Small daily improvements add up to remarkable results.", author: "Robin Sharma" },
  { quote: "Don't watch the clock; do what it does — keep going.", author: "Sam Levenson" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "You don't have to be great to start, but you must start to be great.", author: "Zig Ziglar" },
  { quote: "Financial freedom is available to anyone willing to learn and apply.", author: "Robert Kiyosaki" },
  { quote: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey" },
  { quote: "Do not save what is left after spending; spend what is left after saving.", author: "Warren Buffett" },
  { quote: "The best time to start was yesterday. The next best time is now.", author: "ShiftWise" },
  { quote: "Your hustle today is your freedom tomorrow.", author: "ShiftWise" },
  { quote: "Every expert was once a beginner. Keep shifting.", author: "ShiftWise" },
  { quote: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
]

function getTodaysQuote(): { quote: string; author: string } {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return MOTIVATION_QUOTES[dayOfYear % MOTIVATION_QUOTES.length]
}

// ─── Browser push notifications ───────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false
  if (Notification.permission === "granted") return true
  if (Notification.permission !== "denied") {
    const p = await Notification.requestPermission()
    return p === "granted"
  }
  return false
}

export function showBrowserNotification(title: string, options?: NotificationOptions): void {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(title, { icon: "/icon-192.png", badge: "/icon-192.png", ...options })
  }
}

// ─── Notification generators ──────────────────────────────────────────────────

export function generateNotifications(data: AppData): AppNotification[] {
  const notifications: AppNotification[] = []
  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]

  // ── 1. Daily motivation quote ────────────────────────────────────────────────
  const q = getTodaysQuote()
  notifications.push({
    id: `motivation-${todayStr}`,
    type: "motivation",
    title: "Daily Motivation ✨",
    body: `"${q.quote}" — ${q.author}`,
    emoji: "✨",
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0),
    read: false,
  })

  // ── 2. Upcoming shifts (next 48 hours) ───────────────────────────────────────
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const in48Str = in48h.toISOString().split("T")[0]

  const upcomingShifts = data.shifts
    .filter((s) => s.date >= todayStr && s.date <= in48Str)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

  for (const shift of upcomingShifts.slice(0, 3)) {
    const job = data.jobs.find((j) => j.id === shift.jobId)
    const shiftDate = new Date(shift.date + "T00:00:00")
    const isToday = shift.date === todayStr
    const dayLabel = isToday
      ? "Today"
      : shiftDate.toLocaleDateString("en-AU", { weekday: "long" })

    notifications.push({
      id: `shift-${shift.id}`,
      type: "shift",
      title: `Upcoming Shift 📅`,
      body: `${job?.name ?? "Shift"} — ${dayLabel} ${shift.startTime}–${shift.endTime} (${shift.hours}h)`,
      emoji: "📅",
      timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0),
      read: false,
      link: "/shifts",
    })
  }

  // ── 3. Budget nearing limit ──────────────────────────────────────────────────
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const monthExpenses = data.expenses.filter((e) => e.date >= monthStart)

  for (const cat of data.budgetCategories) {
    const spent = monthExpenses
      .filter((e) => e.category === cat.name)
      .reduce((sum, e) => sum + e.amount, 0)

    const pct = cat.budgeted > 0 ? spent / cat.budgeted : 0

    if (pct >= 1) {
      notifications.push({
        id: `budget-over-${cat.id}`,
        type: "budget",
        title: "Budget Exceeded 🚨",
        body: `You've gone over your ${cat.name} budget ($${cat.budgeted.toFixed(0)}). Spent: $${spent.toFixed(0)}.`,
        emoji: "🚨",
        timestamp: new Date(),
        read: false,
        link: "/budget",
      })
    } else if (pct >= 0.8) {
      notifications.push({
        id: `budget-warn-${cat.id}`,
        type: "budget",
        title: "Budget Alert ⚠️",
        body: `${cat.name} is ${Math.round(pct * 100)}% used this month ($${spent.toFixed(0)} of $${cat.budgeted.toFixed(0)}).`,
        emoji: "⚠️",
        timestamp: new Date(),
        read: false,
        link: "/budget",
      })
    }
  }

  // ── 4. Goal reminders & milestones ──────────────────────────────────────────
  for (const goal of data.goals) {
    const pct = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0
    const deadline = new Date(goal.deadline + "T00:00:00")
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86400000)

    // Deadline approaching
    if (daysLeft > 0 && daysLeft <= 7) {
      notifications.push({
        id: `goal-deadline-${goal.id}`,
        type: "goal",
        title: "Goal Deadline Soon ⏳",
        body: `"${goal.name}" is due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. You're at ${Math.round(pct * 100)}% — keep going!`,
        emoji: "⏳",
        timestamp: new Date(),
        read: false,
        link: "/goals",
      })
    }

    // Milestone notifications
    const milestones = [25, 50, 75, 90, 100]
    for (const m of milestones) {
      if (pct * 100 >= m && pct * 100 < m + 10) {
        notifications.push({
          id: `goal-milestone-${goal.id}-${m}`,
          type: "milestone",
          title: m === 100 ? "Goal Complete! 🎊" : `Goal Milestone 🎯`,
          body:
            m === 100
              ? `You've achieved "${goal.name}"! Amazing work. 🎉`
              : `You've hit ${m}% of "${goal.name}". $${(goal.targetAmount - goal.currentAmount).toFixed(0)} to go!`,
          emoji: m === 100 ? "🎊" : "🎯",
          timestamp: new Date(),
          read: false,
          link: "/goals",
        })
        break
      }
    }
  }

  // ── 5. Earnings milestones this month ────────────────────────────────────────
  const monthEarnings = data.shifts
    .filter((s) => s.date >= monthStart)
    .reduce((sum, s) => sum + s.earnings, 0)

  const earningsMilestones = [500, 1000, 2000, 3000, 5000]
  for (const m of earningsMilestones) {
    if (monthEarnings >= m && monthEarnings < m + 500) {
      notifications.push({
        id: `earnings-milestone-${m}`,
        type: "earnings",
        title: "Earnings Milestone 💰",
        body: `You've earned $${m.toLocaleString()} this month. Incredible hustle! 💪`,
        emoji: "💰",
        timestamp: new Date(),
        read: false,
        link: "/earnings",
      })
      break
    }
  }

  // ── 6. Payday reminder (end of pay period) ───────────────────────────────────
  const dayOfMonth = now.getDate()
  const isPaydayWeek = dayOfMonth >= 25 || dayOfMonth <= 2
  if (isPaydayWeek && data.settings.payPeriod !== "per_shift") {
    notifications.push({
      id: `payday-${now.getFullYear()}-${now.getMonth()}`,
      type: "payday",
      title: "Payday Approaching 💸",
      body: `It's almost payday! Make sure your shifts are logged so your earnings are accurate.`,
      emoji: "💸",
      timestamp: new Date(),
      read: false,
      link: "/shifts",
    })
  }

  // ── 7. No shifts logged this week ────────────────────────────────────────────
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const mondayStr = monday.toISOString().split("T")[0]
  const shiftsThisWeek = data.shifts.filter((s) => s.date >= mondayStr && s.date <= todayStr)

  if (shiftsThisWeek.length === 0 && now.getDay() >= 3) {
    notifications.push({
      id: `no-shifts-${mondayStr}`,
      type: "shift",
      title: "No Shifts Logged 📋",
      body: "You haven't logged any shifts this week. Remember to record your work hours!",
      emoji: "📋",
      timestamp: new Date(),
      read: false,
      link: "/shifts",
    })
  }

  // Sort: unread first, then by timestamp desc
  return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

// ─── Legacy exports (kept for backwards compatibility) ────────────────────────

export function checkGoalMilestones(
  goalName: string,
  currentAmount: number,
  targetAmount: number,
  previousAmount: number
): void {
  const currentPercent = (currentAmount / targetAmount) * 100
  const previousPercent = (previousAmount / targetAmount) * 100
  const milestones = [25, 50, 75, 100]
  for (const milestone of milestones) {
    if (previousPercent < milestone && currentPercent >= milestone) {
      showBrowserNotification("🎉 Goal Milestone Reached!", {
        body: `You've reached ${milestone}% of "${goalName}"!`,
        tag: `goal-${goalName}-${milestone}`,
        requireInteraction: milestone === 100,
      })
      break
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
      showBrowserNotification(`💰 Earnings Milestone!`, {
        body: `You've earned $${milestone.toLocaleString()} ${period}!`,
        tag: `earnings-${milestone}`,
      })
      break
    }
  }
}

// Keep old name for compat
export const showNotification = showBrowserNotification
