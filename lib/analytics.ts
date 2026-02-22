type AnalyticsPayload = Record<string, string | number | boolean>

type AnalyticsFn = (eventName: string, payload?: AnalyticsPayload) => void

export function trackEvent(eventName: string, payload?: AnalyticsPayload) {
  if (typeof window === "undefined") return
  const va = (window as Window & { va?: AnalyticsFn }).va
  if (typeof va === "function") {
    va(eventName, payload)
  }
}
