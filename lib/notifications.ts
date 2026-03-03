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
  priority: "low" | "normal" | "high" | "critical"
  title: string
  body: string
  emoji: string
  timestamp: Date
  read: boolean
  link?: string
  actions?: Array<{
    label: string
    link?: string
    markReadOnly?: boolean
  }>
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
  { quote: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { quote: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { quote: "Do something today that your future self will thank you for.", author: "ShiftWise" },
  { quote: "You don't need more time, you need more focus.", author: "ShiftWise" },
  { quote: "Progress, not perfection, wins in the long run.", author: "ShiftWise" },
  { quote: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
  { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { quote: "Stay consistent. Results will come.", author: "ShiftWise" },
  { quote: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { quote: "Your goals don't care how you feel, they care what you do.", author: "ShiftWise" },
  { quote: "Focus on the step in front of you, not the whole staircase.", author: "ShiftWise" },
  { quote: "Savings grow when habits grow.", author: "ShiftWise" },
  { quote: "Done is better than perfect when building momentum.", author: "ShiftWise" },
  { quote: "What gets measured gets managed.", author: "Peter Drucker" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "The difference between who you are and who you want to be is what you do.", author: "ShiftWise" },
  { quote: "Be stubborn about your goals, flexible about your methods.", author: "ShiftWise" },
  { quote: "Your paycheck can fund your freedom if you give it a plan.", author: "ShiftWise" },
  { quote: "Big journeys begin with one logged shift.", author: "ShiftWise" },
  { quote: "The habit of saving is itself an education.", author: "T.T. Munger" },
  { quote: "Show up, even on low-motivation days.", author: "ShiftWise" },
  { quote: "Consistency compounds faster than intensity.", author: "ShiftWise" },
  { quote: "You are one decision away from a different financial future.", author: "ShiftWise" },
  { quote: "Track it, improve it, repeat it.", author: "ShiftWise" },
  { quote: "Discomfort now, confidence later.", author: "ShiftWise" },
  { quote: "Protect your goals from your moods.", author: "ShiftWise" },
  { quote: "You don't rise to your goals, you fall to your systems.", author: "James Clear" },
  { quote: "Every dollar has a job when your plan is clear.", author: "ShiftWise" },
  { quote: "Small wins create big confidence.", author: "ShiftWise" },
  { quote: "Make today count. Future you is watching.", author: "ShiftWise" },
]

function getTodaysQuote(offset: number = 0): { quote: string; author: string } {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return MOTIVATION_QUOTES[(dayOfYear + offset) % MOTIVATION_QUOTES.length]
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

export function generateNotifications(
  data: AppData,
  options?: {
    motivationOffset?: number
  }
): AppNotification[] {
  if (!data.settings.notificationsEnabled) return []

  const notifications: AppNotification[] = []
  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]
  const enabledTypes = new Set(data.settings.notificationTypes)
  const currencySymbol = data.settings.currencySymbol || "$"
  const keys = new Set<string>()
  const ignoreCounts = getIgnoreCounts()

  const isWithinQuietHours = () => {
    if (!data.settings.quietHoursEnabled) return false
    const [startH, startM] = data.settings.quietHoursStart.split(":").map(Number)
    const [endH, endM] = data.settings.quietHoursEnd.split(":").map(Number)
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    if (startMinutes === endMinutes) return false
    if (startMinutes < endMinutes) return nowMinutes >= startMinutes && nowMinutes < endMinutes
    return nowMinutes >= startMinutes || nowMinutes < endMinutes
  }

  const quietHours = isWithinQuietHours()

  const pushNotification = (notification: AppNotification) => {
    const dedupeKey = `${notification.type}::${notification.id}::${notification.title}`
    if (keys.has(dedupeKey)) return
    keys.add(dedupeKey)

    if (quietHours && notification.priority !== "critical") {
      return
    }

    const ignored = ignoreCounts[notification.id] ?? 0
    if (ignored >= 5 && notification.priority !== "critical") {
      return
    }

    if (ignored >= 3 && notification.priority !== "critical") {
      const escalatedTitle = notification.title.startsWith("Reminder:")
        ? notification.title
        : `Reminder: ${notification.title}`
      notifications.push({ ...notification, title: escalatedTitle, priority: "critical" })
      return
    }

    if (ignored >= 2 && notification.priority === "normal") {
      notifications.push({ ...notification, priority: "high" })
      return
    }

    notifications.push(notification)
  }

  // ── 1. Daily motivation quote ────────────────────────────────────────────────
  const q = getTodaysQuote(options?.motivationOffset ?? 0)
  if (enabledTypes.has("motivation")) pushNotification({
    id: `motivation-${todayStr}`,
    type: "motivation",
    priority: "low",
    title: "Daily Motivation ✨",
    body: `"${q.quote}" — ${q.author}`,
    emoji: "✨",
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0),
    read: false,
    actions: [{ label: "Open goals", link: "/goals" }],
  })

  // ── 2. Upcoming shifts (next 48 hours) ───────────────────────────────────────
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const in48Str = in48h.toISOString().split("T")[0]

  const upcomingShifts = data.shifts
    .filter((s) => s.date >= todayStr && s.date <= in48Str)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

  for (const shift of upcomingShifts.slice(0, 3)) {
    if (!enabledTypes.has("shift")) continue
    const job = data.jobs.find((j) => j.id === shift.jobId)
    const shiftDate = new Date(shift.date + "T00:00:00")
    const isToday = shift.date === todayStr
    const dayLabel = isToday
      ? "Today"
      : shiftDate.toLocaleDateString("en-AU", { weekday: "long" })

    pushNotification({
      id: `shift-${shift.id}`,
      type: "shift",
      priority: isToday ? "high" : "normal",
      title: `Upcoming Shift 📅`,
      body: `${job?.name ?? "Shift"} — ${dayLabel} ${shift.startTime}–${shift.endTime} (${shift.hours}h)`,
      emoji: "📅",
      timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0),
      read: false,
      link: "/shifts",
      actions: [
        { label: "View shifts", link: "/shifts" },
        { label: "Mark read", markReadOnly: true },
      ],
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
      if (enabledTypes.has("budget")) pushNotification({
        id: `budget-over-${cat.id}`,
        type: "budget",
        priority: spent > cat.budgeted * 1.2 ? "critical" : "high",
        title: "Budget Exceeded 🚨",
        body: `You've gone over your ${cat.name} budget (${currencySymbol}${cat.budgeted.toFixed(0)}). Spent: ${currencySymbol}${spent.toFixed(0)}.`,
        emoji: "🚨",
        timestamp: new Date(),
        read: false,
        link: "/budget",
        actions: [{ label: "Open budget", link: "/budget" }],
      })
    } else if (pct >= 0.8) {
      if (enabledTypes.has("budget")) pushNotification({
        id: `budget-warn-${cat.id}`,
        type: "budget",
        priority: pct >= 0.95 ? "high" : "normal",
        title: "Budget Alert ⚠️",
        body: `${cat.name} is ${Math.round(pct * 100)}% used this month (${currencySymbol}${spent.toFixed(0)} of ${currencySymbol}${cat.budgeted.toFixed(0)}).`,
        emoji: "⚠️",
        timestamp: new Date(),
        read: false,
        link: "/budget",
        actions: [{ label: "Adjust budget", link: "/budget" }],
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
      if (enabledTypes.has("goal")) pushNotification({
        id: `goal-deadline-${goal.id}`,
        type: "goal",
        priority: daysLeft <= 1 ? "critical" : "high",
        title: "Goal Deadline Soon ⏳",
        body: `"${goal.name}" is due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. You're at ${Math.round(pct * 100)}% — keep going!`,
        emoji: "⏳",
        timestamp: new Date(),
        read: false,
        link: "/goals",
        actions: [{ label: "Update goal", link: "/goals" }],
      })
    }

    // Milestone notifications
    const milestones = [25, 50, 75, 90, 100]
    for (const m of milestones) {
      if (pct * 100 >= m && pct * 100 < m + 10) {
        if (enabledTypes.has("milestone")) pushNotification({
          id: `goal-milestone-${goal.id}-${m}`,
          type: "milestone",
          priority: m === 100 ? "high" : "normal",
          title: m === 100 ? "Goal Complete! 🎊" : `Goal Milestone 🎯`,
          body:
            m === 100
              ? `You've achieved "${goal.name}"! Amazing work. 🎉`
              : `You've hit ${m}% of "${goal.name}". ${currencySymbol}${(goal.targetAmount - goal.currentAmount).toFixed(0)} to go!`,
          emoji: m === 100 ? "🎊" : "🎯",
          timestamp: new Date(),
          read: false,
          link: "/goals",
          actions: [{ label: "View goals", link: "/goals" }],
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
      if (enabledTypes.has("earnings")) pushNotification({
        id: `earnings-milestone-${m}`,
        type: "earnings",
        priority: m >= 3000 ? "high" : "normal",
        title: "Earnings Milestone 💰",
        body: `You've earned ${currencySymbol}${m.toLocaleString()} this month. Incredible hustle! 💪`,
        emoji: "💰",
        timestamp: new Date(),
        read: false,
        link: "/earnings",
        actions: [{ label: "Open earnings", link: "/earnings" }],
      })
      break
    }
  }

  // ── 6. Payday reminder (end of pay period) ───────────────────────────────────
  const dayOfMonth = now.getDate()
  const isPaydayWeek = dayOfMonth >= 25 || dayOfMonth <= 2
  if (enabledTypes.has("payday") && isPaydayWeek && data.settings.payPeriod !== "per_shift") {
    pushNotification({
      id: `payday-${now.getFullYear()}-${now.getMonth()}`,
      type: "payday",
      priority: "normal",
      title: "Payday Approaching 💸",
      body: `It's almost payday! Make sure your shifts are logged so your earnings are accurate.`,
      emoji: "💸",
      timestamp: new Date(),
      read: false,
      link: "/shifts",
      actions: [{ label: "Review shifts", link: "/shifts" }],
    })
  }

  // ── 7. No shifts logged this week ────────────────────────────────────────────
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const mondayStr = monday.toISOString().split("T")[0]
  const shiftsThisWeek = data.shifts.filter((s) => s.date >= mondayStr && s.date <= todayStr)

  if (enabledTypes.has("shift") && shiftsThisWeek.length === 0 && now.getDay() >= 3) {
    pushNotification({
      id: `no-shifts-${mondayStr}`,
      type: "shift",
      priority: now.getDay() >= 5 ? "high" : "normal",
      title: "No Shifts Logged 📋",
      body: "You haven't logged any shifts this week. Remember to record your work hours!",
      emoji: "📋",
      timestamp: new Date(),
      read: false,
      link: "/shifts",
      actions: [{ label: "Log shift", link: "/shifts" }],
    })
  }

  // Sort: unread first, then by timestamp desc
  return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

const IGNORE_STORAGE_KEY = "shiftwise_notification_ignore_counts"

function getIgnoreCounts(): Record<string, number> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(IGNORE_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, number>
  } catch {
    return {}
  }
}

export function incrementNotificationIgnoreCounts(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return
  try {
    const existing = getIgnoreCounts()
    ids.forEach((id) => {
      existing[id] = (existing[id] ?? 0) + 1
    })
    localStorage.setItem(IGNORE_STORAGE_KEY, JSON.stringify(existing))
  } catch {
    // Ignore storage errors
  }
}

export function clearNotificationIgnoreCount(id: string) {
  if (typeof window === "undefined") return
  try {
    const existing = getIgnoreCounts()
    if (existing[id] === undefined) return
    delete existing[id]
    localStorage.setItem(IGNORE_STORAGE_KEY, JSON.stringify(existing))
  } catch {
    // Ignore storage errors
  }
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
