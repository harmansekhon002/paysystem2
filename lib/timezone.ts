export const DEFAULT_APP_TIME_ZONE = "Asia/Kolkata"

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date())
    return true
  } catch {
    return false
  }
}

export function getBrowserTimeZone(): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (detected && isValidTimeZone(detected)) return detected
  } catch {
    // Ignore environment issues and use fallback.
  }
  return DEFAULT_APP_TIME_ZONE
}

export function resolveTimeZone(value?: string | null): string {
  if (value && isValidTimeZone(value)) return value
  return getBrowserTimeZone()
}

export function getDateKeyInTimeZone(timeZone: string, date: Date = new Date()): string {
  const resolved = resolveTimeZone(timeZone)
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: resolved,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  let year = "0000"
  let month = "01"
  let day = "01"

  for (const part of parts) {
    if (part.type === "year") year = part.value
    if (part.type === "month") month = part.value
    if (part.type === "day") day = part.value
  }

  return `${year}-${month}-${day}`
}

export function getClockPartsInTimeZone(
  timeZone: string,
  date: Date = new Date()
): { year: number; month: number; day: number; hour: number; minute: number } {
  const resolved = resolveTimeZone(timeZone)
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: resolved,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)

  let year = 0
  let month = 1
  let day = 1
  let hour = 0
  let minute = 0

  for (const part of parts) {
    if (part.type === "year") year = Number(part.value)
    if (part.type === "month") month = Number(part.value)
    if (part.type === "day") day = Number(part.value)
    if (part.type === "hour") hour = Number(part.value)
    if (part.type === "minute") minute = Number(part.value)
  }

  return { year, month, day, hour, minute }
}
