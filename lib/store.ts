"use client"

// ShiftWise data store - Australian penalty rate system
// Supports weekday, Saturday, Sunday, public holiday & overtime rates per job

export type RateType = "weekday" | "saturday" | "sunday" | "public_holiday" | "overtime"

export type PenaltyRates = {
  weekday: number
  saturday: number
  sunday: number
  public_holiday: number
  overtime: number
}

export type JobTemplate = {
  id: string
  name: string
  category: "hospitality" | "retail" | "tutoring" | "delivery" | "custom"
  baseRate: number
  rates: PenaltyRates
  color: string
}

export type Shift = {
  id: string
  date: string
  startTime: string
  endTime: string
  jobId: string
  rateType: RateType
  breakMinutes: number
  hours: number
  earnings: number
  note?: string
}

export type Expense = {
  id: string
  category: string
  amount: number
  description: string
  date: string
}

export type BudgetCategory = {
  id: string
  name: string
  budgeted: number
  color: string
}

export type Goal = {
  id: string
  name: string
  icon: string
  targetAmount: number
  currentAmount: number
  deadline: string
}

export type PayPeriod = "weekly" | "biweekly" | "monthly" | "per_shift"

export type SpecialCompanionSettings = {
  nickname: string
  lovesPuppies: boolean
  loveThemeEnabled: boolean
  waterBottleGoal: number
  pinEnabled: boolean
  pinCode: string
  privacyMode: boolean
  remindersEnabled: boolean
  celebrationEnabled: boolean
}

export type AppSettings = {
  currency: string
  currencySymbol: string
  payPeriod: PayPeriod
  country: string
  timeZone: string
  whatsappNumber: string
  worldClockPrimaryLabel: string
  worldClockPrimaryTimeZone: string
  worldClockSecondaryLabel: string
  worldClockSecondaryTimeZone: string
  notificationsEnabled: boolean
  notificationTypes: string[]
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  dashboardWidgets: {
    quickActions: boolean
    profitability: boolean
    stats: boolean
    weeklyChart: boolean
    jobBreakdown: boolean
    upcomingShifts: boolean
  }
  specialCompanion: SpecialCompanionSettings
}

export type AttendanceEvent = {
  id: string
  date: string
  jobId: string
  type: "late" | "absent"
  minutesLate?: number
  note?: string
}

export type AppData = {
  jobs: JobTemplate[]
  shifts: Shift[]
  attendanceEvents: AttendanceEvent[]
  expenses: Expense[]
  budgetCategories: BudgetCategory[]
  goals: Goal[]
  settings: AppSettings
  publicHolidays: string[] // ISO date strings
}

// Australian job color palette - clean, distinguishable
const JOB_COLORS = [
  "#0d9488", // teal
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#06b6d4", // cyan
]

export function getJobColor(index: number): string {
  return JOB_COLORS[index % JOB_COLORS.length]
}

// Australian award rate templates
export const JOB_TEMPLATES: Omit<JobTemplate, "id" | "color">[] = [
  {
    name: "Cafe / Restaurant",
    category: "hospitality",
    baseRate: 25.41,
    rates: { weekday: 25.41, saturday: 30.49, sunday: 35.57, public_holiday: 50.82, overtime: 38.12 },
  },
  {
    name: "Retail Store",
    category: "retail",
    baseRate: 26.73,
    rates: { weekday: 26.73, saturday: 32.08, sunday: 37.42, public_holiday: 53.46, overtime: 40.10 },
  },
  {
    name: "Tutoring",
    category: "tutoring",
    baseRate: 45.00,
    rates: { weekday: 45.00, saturday: 45.00, sunday: 45.00, public_holiday: 45.00, overtime: 45.00 },
  },
  {
    name: "Uber Eats / Delivery",
    category: "delivery",
    baseRate: 22.00,
    rates: { weekday: 22.00, saturday: 22.00, sunday: 22.00, public_holiday: 22.00, overtime: 22.00 },
  },
  {
    name: "Fast Food",
    category: "hospitality",
    baseRate: 24.50,
    rates: { weekday: 24.50, saturday: 29.40, sunday: 34.30, public_holiday: 49.00, overtime: 36.75 },
  },
  {
    name: "Bar / Pub",
    category: "hospitality",
    baseRate: 27.10,
    rates: { weekday: 27.10, saturday: 32.52, sunday: 37.94, public_holiday: 54.20, overtime: 40.65 },
  },
]

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  weekday: "Weekday",
  saturday: "Saturday",
  sunday: "Sunday",
  public_holiday: "Public Holiday",
  overtime: "Overtime",
}

export const RATE_TYPE_MULTIPLIER_LABELS: Record<RateType, string> = {
  weekday: "1x",
  saturday: "1.25x",
  sunday: "1.5x",
  public_holiday: "2x",
  overtime: "1.5x",
}

export function calculateShiftHours(startTime: string, endTime: string, breakMinutes: number = 0): number {
  const [startH, startM] = startTime.split(":").map(Number)
  const [endH, endM] = endTime.split(":").map(Number)
  let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM)
  if (totalMinutes < 0) totalMinutes += 24 * 60
  totalMinutes -= breakMinutes
  return Math.round((totalMinutes / 60) * 100) / 100
}

export function calculateShiftEarnings(hours: number, job: JobTemplate, rateType: RateType): number {
  const rate = job.rates[rateType]
  return Math.round(hours * rate * 100) / 100
}

export function detectRateType(dateStr: string, publicHolidays: string[]): RateType {
  if (publicHolidays.includes(dateStr)) return "public_holiday"
  const day = new Date(dateStr).getDay()
  if (day === 6) return "saturday"
  if (day === 0) return "sunday"
  return "weekday"
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function formatAUD(amount: number): string {
  return `$${amount.toFixed(2)}`
}

export function formatCurrency(amount: number, currencySymbol: string = "$" ): string {
  return `${currencySymbol}${amount.toFixed(2)}`
}

// 2026 Australian public holidays (national)
const AU_PUBLIC_HOLIDAYS_2026 = [
  "2026-01-01", "2026-01-26", "2026-04-03", "2026-04-04",
  "2026-04-06", "2026-04-25", "2026-06-08", "2026-12-25", "2026-12-26",
  "2026-12-28",
]

export const defaultData: AppData = {
  jobs: [],
  shifts: [],
  attendanceEvents: [],
  expenses: [],
  budgetCategories: [],
  goals: [],
  settings: {
    currency: "AUD",
    currencySymbol: "A$",
    payPeriod: "biweekly",
    country: "Australia",
    timeZone: "Asia/Kolkata",
    whatsappNumber: "",
    worldClockPrimaryLabel: "Brisbane",
    worldClockPrimaryTimeZone: "Australia/Brisbane",
    worldClockSecondaryLabel: "Punjab",
    worldClockSecondaryTimeZone: "Asia/Kolkata",
    notificationsEnabled: true,
    notificationTypes: ["shift", "budget", "goal", "earnings", "payday", "motivation", "milestone", "special"],
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    dashboardWidgets: {
      quickActions: true,
      profitability: true,
      stats: true,
      weeklyChart: true,
      jobBreakdown: true,
      upcomingShifts: true,
    },
    specialCompanion: {
      nickname: "Wifey",
      lovesPuppies: true,
      loveThemeEnabled: false,
      waterBottleGoal: 8,
      pinEnabled: false,
      pinCode: "",
      privacyMode: false,
      remindersEnabled: true,
      celebrationEnabled: true,
    },
  },
  publicHolidays: AU_PUBLIC_HOLIDAYS_2026,
}

export const GOAL_ICONS = [
  "car", "plane", "laptop", "piggy-bank", "graduation-cap",
  "home", "smartphone", "music", "dumbbell", "heart",
]
