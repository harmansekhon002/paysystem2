"use client"

import { toast } from "@/hooks/use-toast"

export const SPECIAL_CELEBRATION_EVENT = "shiftwise:special-celebration"

type ThemeToastMode = "light" | "dark" | "love"

function isSpecialContext(modeOverride?: ThemeToastMode) {
  if (typeof document === "undefined") return false
  if (modeOverride === "love") return true
  return document.querySelector('[data-special-user="true"]') !== null
}

function getActiveThemeMode(): ThemeToastMode {
  if (typeof document === "undefined") return "light"
  if (document.querySelector(".love-theme")) return "love"
  if (document.documentElement.classList.contains("dark")) return "dark"
  return "light"
}

function getThemeToastClass(modeOverride?: ThemeToastMode) {
  const mode = modeOverride ?? getActiveThemeMode()

  if (mode === "love") {
    return "border-rose-300/70 bg-gradient-to-br from-rose-500/95 via-pink-500/92 to-orange-400/90 text-white shadow-2xl shadow-rose-500/30"
  }

  if (mode === "dark") {
    return "border-emerald-300/30 bg-gradient-to-br from-slate-950 via-emerald-900/90 to-blue-900/95 text-emerald-100 shadow-2xl shadow-black/45"
  }

  return "border-amber-200/80 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 text-orange-900 shadow-xl shadow-amber-200/55"
}

export function showLoveToast(feature: string, modeOverride?: ThemeToastMode) {
  toast({
    title: "From your love Harman",
    description: feature,
    className: getThemeToastClass(modeOverride),
    duration: 4200,
  })
}

export function triggerSpecialCelebration(feature: string, modeOverride?: ThemeToastMode) {
  if (!isSpecialContext(modeOverride)) return
  showLoveToast(feature, modeOverride)
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SPECIAL_CELEBRATION_EVENT, {
        detail: { feature, mode: modeOverride },
      })
    )
  }
}
