"use client"

import type { AppData } from "@/lib/store"
import { getClockPartsInTimeZone, getDateKeyInTimeZone, resolveTimeZone } from "@/lib/timezone"

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "shift"
  | "budget"
  | "goal"
  | "earnings"
  | "payday"
  | "motivation"
  | "milestone"
  | "special"

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

export type CompanionMoodEntry = {
  date: string
  mood: string
  note?: string
  savedAt?: string
}

export type RoutineHistorySnapshot = {
  waterBottles?: number
  sleepHours?: number
  exerciseDone?: boolean
  paathDone?: boolean
  studyDone?: boolean
}

export type LoveStreakStats = {
  hydration: number
  discipline: number
  allHabits: number
}

export type BurnoutRisk = {
  level: "low" | "moderate" | "high"
  score: number
  reasons: string[]
  recommendation: string
}

const LOW_MOOD_VALUES = new Set(["sad", "stressed", "tired", "low", "anxious", "down"])
const HIGH_MOOD_VALUES = new Set(["happy", "excited", "focused", "calm", "grateful"])
const DEFAULT_HYDRATION_GOAL = 8
const MIN_HYDRATION_GOAL = 4
const MAX_HYDRATION_GOAL = 12

export function clampHydrationGoal(goal?: number) {
  const parsed = Number(goal)
  if (!Number.isFinite(parsed)) return DEFAULT_HYDRATION_GOAL
  return Math.max(MIN_HYDRATION_GOAL, Math.min(MAX_HYDRATION_GOAL, Math.round(parsed)))
}

export function getHydrationStreakTarget(goal?: number) {
  const dailyGoal = clampHydrationGoal(goal)
  return Math.max(4, dailyGoal - 2)
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function toDayStart(dateString: string) {
  return new Date(`${dateString}T00:00:00`)
}

function isConsecutivePreviousDay(current: string, previous: string) {
  const currentDate = toDayStart(current)
  const previousDate = toDayStart(previous)
  const deltaMs = currentDate.getTime() - previousDate.getTime()
  return deltaMs === 24 * 60 * 60 * 1000
}

function getConsecutiveStreak<T>(
  history: Record<string, T>,
  predicate: (entry: T) => boolean
) {
  const orderedDates = Object.keys(history)
    .filter(isIsoDate)
    .sort((a, b) => b.localeCompare(a))

  if (orderedDates.length === 0) return 0
  if (!predicate(history[orderedDates[0]])) return 0

  let streak = 1
  for (let index = 1; index < orderedDates.length; index += 1) {
    const previousDate = orderedDates[index - 1]
    const currentDate = orderedDates[index]
    if (!isConsecutivePreviousDay(previousDate, currentDate)) break
    if (!predicate(history[currentDate])) break
    streak += 1
  }

  return streak
}

export function computeLoveStreaksFromHistory(
  history: Record<string, RoutineHistorySnapshot>,
  hydrationTarget: number = 6
): LoveStreakStats {
  const resolvedHydrationTarget = Math.max(1, Math.round(hydrationTarget))
  return {
    hydration: getConsecutiveStreak(history, (entry) => (entry.waterBottles ?? 0) >= resolvedHydrationTarget),
    discipline: getConsecutiveStreak(history, (entry) => Boolean(entry.exerciseDone && entry.paathDone && entry.studyDone)),
    allHabits: getConsecutiveStreak(
      history,
      (entry) => (entry.waterBottles ?? 0) >= resolvedHydrationTarget && Boolean(entry.exerciseDone && entry.paathDone && entry.studyDone)
    ),
  }
}

export function getLowMoodStreak(history: CompanionMoodEntry[]): number {
  const latestByDate = new Map<string, CompanionMoodEntry>()
  history.forEach((entry) => {
    if (!isIsoDate(entry.date)) return
    const existing = latestByDate.get(entry.date)
    const existingTime = existing?.savedAt ? Date.parse(existing.savedAt) : 0
    const nextTime = entry.savedAt ? Date.parse(entry.savedAt) : 0
    if (!existing || nextTime >= existingTime) {
      latestByDate.set(entry.date, entry)
    }
  })

  const orderedDates = [...latestByDate.keys()].sort((a, b) => b.localeCompare(a))
  if (orderedDates.length === 0) return 0

  const first = latestByDate.get(orderedDates[0])
  if (!first || !LOW_MOOD_VALUES.has(first.mood.toLowerCase().trim())) return 0

  let streak = 1
  for (let index = 1; index < orderedDates.length; index += 1) {
    const previousDate = orderedDates[index - 1]
    const currentDate = orderedDates[index]
    if (!isConsecutivePreviousDay(previousDate, currentDate)) break

    const currentEntry = latestByDate.get(currentDate)
    if (!currentEntry || !LOW_MOOD_VALUES.has(currentEntry.mood.toLowerCase().trim())) break
    streak += 1
  }

  return streak
}

function getLatestMoodByDate(history: CompanionMoodEntry[]) {
  const latestByDate = new Map<string, CompanionMoodEntry>()
  history.forEach((entry) => {
    if (!isIsoDate(entry.date)) return
    const existing = latestByDate.get(entry.date)
    const existingTime = existing?.savedAt ? Date.parse(existing.savedAt) : 0
    const nextTime = entry.savedAt ? Date.parse(entry.savedAt) : 0
    if (!existing || nextTime >= existingTime) {
      latestByDate.set(entry.date, entry)
    }
  })
  return latestByDate
}

export function computeBurnoutRisk(params: {
  moodHistory: CompanionMoodEntry[]
  routineHistory: Record<string, RoutineHistorySnapshot>
  todayWorkloadHours: number
  next48WorkloadHours: number
}): BurnoutRisk {
  const { moodHistory, routineHistory, todayWorkloadHours, next48WorkloadHours } = params

  let score = 0
  const reasons: string[] = []

  const moodByDate = getLatestMoodByDate(moodHistory)
  const moodDates = [...moodByDate.keys()].sort((a, b) => b.localeCompare(a))
  const lowMoodStreak = getLowMoodStreak(moodHistory)
  const lowMoodDaysRecent = moodDates
    .slice(0, 5)
    .filter((date) => {
      const mood = moodByDate.get(date)?.mood?.toLowerCase().trim() ?? ""
      return LOW_MOOD_VALUES.has(mood)
    }).length

  if (lowMoodStreak >= 2) {
    score += 25
    reasons.push(`${lowMoodStreak}-day low mood streak`)
  }
  if (lowMoodStreak >= 4) {
    score += 15
  }
  if (lowMoodDaysRecent >= 3) {
    score += 12
    reasons.push(`${lowMoodDaysRecent} low-mood days in last 5 days`)
  }

  const routineDates = Object.keys(routineHistory)
    .filter(isIsoDate)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 7)
  const routineEntries = routineDates.map((date) => routineHistory[date])

  if (routineEntries.length > 0) {
    const averageSleep = routineEntries.reduce((sum, entry) => sum + (entry.sleepHours ?? 0), 0) / routineEntries.length
    const averageHydration = routineEntries.reduce((sum, entry) => sum + (entry.waterBottles ?? 0), 0) / routineEntries.length
    const lowRecoveryDays = routineEntries.filter((entry) => (entry.sleepHours ?? 0) < 6 || (entry.waterBottles ?? 0) < 4).length
    const missedRoutineDays = routineEntries
      .slice(0, 4)
      .filter((entry) => !entry.exerciseDone && !entry.paathDone && !entry.studyDone).length

    if (averageSleep < 6.5) {
      score += 20
      reasons.push(`low weekly sleep (${averageSleep.toFixed(1)}h avg)`)
    }
    if (averageSleep < 5.5) {
      score += 10
    }

    if (averageHydration < 4.5) {
      score += 15
      reasons.push(`low weekly hydration (${averageHydration.toFixed(1)} bottles avg)`)
    }
    if (averageHydration < 3) {
      score += 10
    }

    if (lowRecoveryDays >= 3) {
      score += 10
      reasons.push(`${lowRecoveryDays} recent low-recovery days`)
    }

    if (missedRoutineDays >= 2) {
      score += Math.min(15, missedRoutineDays * 5)
      reasons.push(`${missedRoutineDays} missed routine days this week`)
    }
  }

  if (todayWorkloadHours >= 8) {
    score += 12
    reasons.push(`heavy workload today (${todayWorkloadHours.toFixed(1)}h)`)
  }
  if (next48WorkloadHours >= 12) {
    score += 15
    reasons.push(`high upcoming workload (${next48WorkloadHours.toFixed(1)}h in 48h)`)
  }
  if (next48WorkloadHours >= 18) {
    score += 10
  }

  const boundedScore = Math.max(0, Math.min(100, score))
  const level: BurnoutRisk["level"] = boundedScore >= 70 ? "high" : boundedScore >= 45 ? "moderate" : "low"

  const recommendation =
    level === "high"
      ? "Reduce pressure immediately, prioritize recovery basics, and use support ping if needed."
      : level === "moderate"
        ? "Keep tasks light, avoid over-committing, and protect sleep/hydration for the next 48 hours."
        : "Current load looks manageable. Maintain routine consistency and recovery habits."

  return {
    level,
    score: boundedScore,
    reasons: reasons.slice(0, 4),
    recommendation,
  }
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
    isSpecialUser?: boolean
    specialName?: string
    specialRemindersEnabled?: boolean
    adaptiveMood?: string
    moodHistory?: CompanionMoodEntry[]
    loveStreaks?: LoveStreakStats
    burnoutRisk?: BurnoutRisk
    timeZone?: string
  }
): AppNotification[] {
  if (!data.settings.notificationsEnabled) return []

  const notifications: AppNotification[] = []
  const now = new Date()
  const timeZone = resolveTimeZone(options?.timeZone ?? data.settings.timeZone)
  const nowParts = getClockPartsInTimeZone(timeZone, now)
  const todayStr = getDateKeyInTimeZone(timeZone, now)
  const enabledTypes = new Set(data.settings.notificationTypes)
  const currencySymbol = data.settings.currencySymbol || "$"
  const keys = new Set<string>()
  const ignoreCounts = getIgnoreCounts()

  const isWithinQuietHours = () => {
    if (!data.settings.quietHoursEnabled) return false
    const [startH, startM] = data.settings.quietHoursStart.split(":").map(Number)
    const [endH, endM] = data.settings.quietHoursEnd.split(":").map(Number)
    const nowMinutes = nowParts.hour * 60 + nowParts.minute
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
    timestamp: new Date(nowParts.year, nowParts.month - 1, nowParts.day, 8, 0, 0),
    read: false,
    actions: [{ label: "Open goals", link: "/goals" }],
  })

  // ── 2. Upcoming shifts (next 48 hours) ───────────────────────────────────────
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const in48Str = getDateKeyInTimeZone(timeZone, in48h)

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
      timestamp: new Date(nowParts.year, nowParts.month - 1, nowParts.day, 7, 0, 0),
      read: false,
      link: "/shifts",
      actions: [
        { label: "View shifts", link: "/shifts" },
        { label: "Mark read", markReadOnly: true },
      ],
    })
  }

  // ── 3. Budget nearing limit ──────────────────────────────────────────────────
  const monthStart = `${String(nowParts.year)}-${String(nowParts.month).padStart(2, "0")}-01`
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
  const dayOfMonth = nowParts.day
  const isPaydayWeek = dayOfMonth >= 25 || dayOfMonth <= 2
  if (enabledTypes.has("payday") && isPaydayWeek && data.settings.payPeriod !== "per_shift") {
    pushNotification({
      id: `payday-${nowParts.year}-${nowParts.month}`,
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
  const todayDate = new Date(`${todayStr}T00:00:00Z`)
  const todayWeekday = todayDate.getUTCDay()
  const monday = new Date(todayDate)
  monday.setUTCDate(todayDate.getUTCDate() - ((todayWeekday + 6) % 7))
  const mondayStr = monday.toISOString().split("T")[0]
  const shiftsThisWeek = data.shifts.filter((s) => s.date >= mondayStr && s.date <= todayStr)

  if (enabledTypes.has("shift") && shiftsThisWeek.length === 0 && todayWeekday >= 3) {
    pushNotification({
      id: `no-shifts-${mondayStr}`,
      type: "shift",
      priority: todayWeekday >= 5 ? "high" : "normal",
      title: "No Shifts Logged 📋",
      body: "You haven't logged any shifts this week. Remember to record your work hours!",
      emoji: "📋",
      timestamp: new Date(),
      read: false,
      link: "/shifts",
      actions: [{ label: "Log shift", link: "/shifts" }],
    })
  }

  // ── 8. Special companion reminders ───────────────────────────────────────────
  const specialRemindersEnabled = options?.specialRemindersEnabled ?? true
  if (options?.isSpecialUser && specialRemindersEnabled && enabledTypes.has("special")) {
    const specialName = options.specialName || "wifey"
    const hour = nowParts.hour
    const hydrationGoal = clampHydrationGoal(data.settings.specialCompanion.waterBottleGoal)
    const adaptiveMood = options.adaptiveMood?.toLowerCase().trim() ?? ""
    const isLowMood = LOW_MOOD_VALUES.has(adaptiveMood)
    const isHighMood = HIGH_MOOD_VALUES.has(adaptiveMood)
    const burnoutRisk = options.burnoutRisk
    const highBurnout = burnoutRisk?.level === "high"
    const moderateBurnout = burnoutRisk?.level === "moderate"
    const lowMoodStreak = getLowMoodStreak(options.moodHistory ?? [])
    const loveStreaks = options.loveStreaks ?? { hydration: 0, discipline: 0, allHabits: 0 }

    const waterBody = isLowMood
      ? `${specialName}, gentle hydration check. Even half a bottle counts right now. Goal: ${hydrationGoal} today. - love Harman`
      : isHighMood
        ? `${specialName}, your energy looks high today. Keep it flowing with one water bottle. Goal: ${hydrationGoal} today. - love Harman`
        : `${specialName}, drink one full water bottle now. Goal: ${hydrationGoal} today. - love Harman`

    const exerciseBody = isLowMood
      ? "Take a gentle 10-20 min walk/stretch and breathe. - love Harman"
      : "Move your body for 20-30 mins today. - love Harman"

    const paathBody = isLowMood
      ? "Take 5 mindful minutes for paath and calm your mind. - love Harman"
      : "Take your paath time for peace and focus today. - love Harman"

    const studyBody = isLowMood
      ? "Try one short focus block (15-20 mins). Small wins matter. - love Harman"
      : "Put in your focused study session today. - love Harman"

    pushNotification({
      id: `special-water-${todayStr}-${hour}`,
      type: "special",
      priority: highBurnout ? "normal" : isLowMood ? "normal" : "high",
      title: "Hydration time 💧",
      body: waterBody,
      emoji: "💧",
      timestamp: new Date(nowParts.year, nowParts.month - 1, nowParts.day, hour, 0, 0),
      read: false,
      link: "/wifey-routine",
      actions: [{ label: "Mark in routine", link: "/wifey-routine" }],
    })

    if (!highBurnout) {
      pushNotification({
        id: `special-exercise-${todayStr}`,
        type: "special",
        priority: isLowMood ? "normal" : hour >= 8 && hour <= 12 ? "high" : "normal",
        title: "Exercise check 🏃‍♀️",
        body: exerciseBody,
        emoji: "🏃‍♀️",
        timestamp: new Date(nowParts.year, nowParts.month - 1, nowParts.day, 8, 0, 0),
        read: false,
        link: "/wifey-routine",
        actions: [{ label: "Open routine", link: "/wifey-routine" }],
      })
    }

    pushNotification({
      id: `special-paath-${todayStr}`,
      type: "special",
      priority: highBurnout ? "normal" : isLowMood ? "normal" : hour >= 6 && hour <= 10 ? "high" : "normal",
      title: "Paath reminder 🙏",
      body: paathBody,
      emoji: "🙏",
      timestamp: new Date(nowParts.year, nowParts.month - 1, nowParts.day, 7, 0, 0),
      read: false,
      link: "/wifey-routine",
      actions: [{ label: "Mark done", link: "/wifey-routine" }],
    })

    if (!highBurnout) {
      pushNotification({
        id: `special-study-${todayStr}`,
        type: "special",
        priority: isLowMood ? "normal" : hour >= 18 && hour <= 22 ? "high" : "normal",
        title: "Study block 📚",
        body: studyBody,
        emoji: "📚",
        timestamp: new Date(nowParts.year, nowParts.month - 1, nowParts.day, 19, 0, 0),
        read: false,
        link: "/wifey-routine",
        actions: [{ label: "Start now", link: "/wifey-routine" }],
      })
    }

    if (highBurnout || moderateBurnout) {
      pushNotification({
        id: `special-burnout-guard-${todayStr}-${burnoutRisk?.score ?? 0}`,
        type: "special",
        priority: highBurnout ? "high" : "normal",
        title: "Burnout guard active 🛡️",
        body: burnoutRisk?.recommendation ?? "Keep intensity low and protect recovery for the next 48 hours.",
        emoji: "🛡️",
        timestamp: new Date(),
        read: false,
        link: "/wifey-routine",
        actions: [{ label: "Open care plan", link: "/wifey-routine" }],
      })
    }

    if (highBurnout) {
      pushNotification({
        id: `special-recovery-break-${todayStr}`,
        type: "special",
        priority: "high",
        title: "Recovery break first 🌿",
        body: "Skip heavy targets today. Hydrate, rest, paath, and one gentle task are enough. - love Harman",
        emoji: "🌿",
        timestamp: new Date(),
        read: false,
        link: "/wifey-routine",
        actions: [{ label: "Use support mode", link: "/wifey-routine" }],
      })
    }

    if (lowMoodStreak >= 2) {
      pushNotification({
        id: `special-care-nudge-${todayStr}-${lowMoodStreak}`,
        type: "special",
        priority: lowMoodStreak >= 4 ? "critical" : "high",
        title: "Care mode check-in 🤍",
        body: `${specialName}, you've had ${lowMoodStreak} low days in a row. Take it easy, hydrate, and do one light routine step. I'm proud of you. - love Harman`,
        emoji: "🤍",
        timestamp: new Date(),
        read: false,
        link: "/wifey-routine",
        actions: [
          { label: "Open routine", link: "/wifey-routine" },
          { label: "See couple dash", link: "/couple-dashboard" },
        ],
      })
    }

    const bestLoveStreak = Math.max(loveStreaks.hydration, loveStreaks.discipline, loveStreaks.allHabits)
    if (bestLoveStreak >= 3 && !highBurnout) {
      const streakLabel =
        loveStreaks.allHabits === bestLoveStreak
          ? "all-habits"
          : loveStreaks.discipline === bestLoveStreak
            ? "discipline"
            : "hydration"

      const streakBody =
        streakLabel === "all-habits"
          ? `${bestLoveStreak}-day all-habits streak. You're unstoppable right now. - love Harman`
          : streakLabel === "discipline"
            ? `${bestLoveStreak}-day discipline streak on exercise + paath + study. Amazing consistency. - love Harman`
            : `${bestLoveStreak}-day hydration streak. Keep the momentum strong. - love Harman`

      pushNotification({
        id: `special-love-streak-${todayStr}-${streakLabel}-${bestLoveStreak}`,
        type: "special",
        priority: bestLoveStreak >= 7 ? "high" : "normal",
        title: "Love streak reward 🔥",
        body: streakBody,
        emoji: "🔥",
        timestamp: new Date(),
        read: false,
        link: "/wifey-routine",
        actions: [{ label: "Track today", link: "/wifey-routine" }],
      })
    }
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
