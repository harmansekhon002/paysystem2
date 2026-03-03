"use client"

import { useEffect, useState } from "react"
import { getDateKeyInTimeZone, resolveTimeZone } from "@/lib/timezone"

export function useZonedDateKey(timeZone?: string | null): string {
  const resolvedTimeZone = resolveTimeZone(timeZone)
  const [dateKey, setDateKey] = useState(() => getDateKeyInTimeZone(resolvedTimeZone))

  useEffect(() => {
    setDateKey(getDateKeyInTimeZone(resolvedTimeZone))
    const timer = window.setInterval(() => {
      setDateKey((current) => {
        const next = getDateKeyInTimeZone(resolvedTimeZone)
        return current === next ? current : next
      })
    }, 15000)

    return () => window.clearInterval(timer)
  }, [resolvedTimeZone])

  return dateKey
}
