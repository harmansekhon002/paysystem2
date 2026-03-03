"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Link from "next/link"
import { Bell, X, ExternalLink, CheckCheck } from "lucide-react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAppData } from "@/components/data-provider"
import {
  generateNotifications,
  requestNotificationPermission,
  showBrowserNotification,
  incrementNotificationIgnoreCounts,
  clearNotificationIgnoreCount,
  type AppNotification,
  type CompanionMoodEntry,
  computeBurnoutRisk,
  computeLoveStreaksFromHistory,
  type RoutineHistorySnapshot,
} from "@/lib/notifications"
import type React from "react"

const STORAGE_KEY = "shiftwise_read_notifications"

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // Ignore storage errors
  }
}

const TYPE_COLORS: Record<string, string> = {
  shift: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  budget: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  goal: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  earnings: "bg-green-500/15 text-green-600 dark:text-green-400",
  payday: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  motivation: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  milestone: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  special: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
}

const PRIORITY_STYLES: Record<AppNotification["priority"], string> = {
  low: "bg-secondary text-muted-foreground",
  normal: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  high: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  critical: "bg-red-500/15 text-red-600 dark:text-red-400",
}

type PanelThemeMode = "light" | "dark" | "love"

function getActivePanelThemeMode(): PanelThemeMode {
  if (typeof document === "undefined") return "light"
  if (document.querySelector(".love-theme")) return "love"
  if (document.documentElement.classList.contains("dark")) return "dark"
  return "light"
}

function getPanelThemeVariables(mode: PanelThemeMode): React.CSSProperties {
  if (mode === "love") {
    return {
      "--card": "oklch(0.992 0.02 8)",
      "--card-foreground": "oklch(0.34 0.12 6)",
      "--border": "oklch(0.89 0.04 10)",
      "--primary": "oklch(0.68 0.2 6)",
      "--muted": "oklch(0.955 0.03 10)",
      "--muted-foreground": "oklch(0.5 0.09 6)",
      "--secondary": "oklch(0.95 0.04 12)",
    } as React.CSSProperties
  }

  if (mode === "dark") {
    return {
      "--card": "oklch(0.2 0.02 250)",
      "--card-foreground": "oklch(0.93 0.02 250)",
      "--border": "oklch(0.38 0.05 205)",
      "--primary": "oklch(0.68 0.14 195)",
      "--muted": "oklch(0.26 0.02 240)",
      "--muted-foreground": "oklch(0.76 0.02 235)",
      "--secondary": "oklch(0.3 0.03 220)",
    } as React.CSSProperties
  }

  return {
    "--card": "oklch(0.995 0.005 250)",
    "--card-foreground": "oklch(0.22 0.02 250)",
    "--border": "oklch(0.91 0.01 250)",
    "--primary": "oklch(0.58 0.1 230)",
    "--muted": "oklch(0.97 0.005 250)",
    "--muted-foreground": "oklch(0.5 0.015 250)",
    "--secondary": "oklch(0.96 0.01 250)",
  } as React.CSSProperties
}

export function NotificationCenter() {
  const { data, isSpecialUser, displayName } = useAppData()
  const loveModeActive = isSpecialUser && data.settings.specialCompanion.loveThemeEnabled
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [motivationOffset, setMotivationOffset] = useState(0)
  const [clockTick, setClockTick] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClockTick((tick) => tick + 1)
    }, 60 * 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0]
    let adaptiveMood: string | undefined
    let moodHistory: CompanionMoodEntry[] | undefined
    let loveStreaks: ReturnType<typeof computeLoveStreaksFromHistory> | undefined
    let burnoutRisk: ReturnType<typeof computeBurnoutRisk> | undefined

    if (loveModeActive) {
      try {
        const currentMoodRaw = localStorage.getItem(`shiftwise:wifey-mood:${todayStr}`)
        if (currentMoodRaw) {
          const parsed = JSON.parse(currentMoodRaw) as CompanionMoodEntry
          adaptiveMood = parsed.mood
        }

        const moodHistoryRaw = localStorage.getItem("shiftwise:wifey-mood-history")
        if (moodHistoryRaw) {
          moodHistory = JSON.parse(moodHistoryRaw) as CompanionMoodEntry[]
        }

        const routineHistoryRaw = localStorage.getItem("shiftwise:wifey-routine-history")
        if (routineHistoryRaw) {
          const routineHistory = JSON.parse(routineHistoryRaw) as Record<string, RoutineHistorySnapshot>
          loveStreaks = computeLoveStreaksFromHistory(routineHistory)
          const cutoff = new Date()
          cutoff.setDate(cutoff.getDate() + 2)
          const cutoffDate = cutoff.toISOString().split("T")[0]

          const todayWorkloadHours = data.shifts
            .filter((shift) => shift.date === todayStr)
            .reduce((sum, shift) => sum + shift.hours, 0)
          const next48WorkloadHours = data.shifts
            .filter((shift) => shift.date >= todayStr && shift.date <= cutoffDate)
            .reduce((sum, shift) => sum + shift.hours, 0)

          burnoutRisk = computeBurnoutRisk({
            moodHistory: moodHistory ?? [],
            routineHistory,
            todayWorkloadHours,
            next48WorkloadHours,
          })
        }
      } catch {
        // Ignore malformed local storage entries.
      }
    }

    const generated = generateNotifications(data, {
      motivationOffset,
      isSpecialUser: loveModeActive,
      specialName: displayName,
      specialRemindersEnabled: loveModeActive && data.settings.specialCompanion.remindersEnabled,
      adaptiveMood,
      moodHistory,
      loveStreaks,
      burnoutRisk,
    })
    const storedRead = getReadIds()
    setReadIds(storedRead)
    setNotifications(generated.map((n) => ({ ...n, read: storedRead.has(n.id) })))
  }, [data, displayName, loveModeActive, motivationOffset, clockTick])

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  const handleClosePanel = useCallback(() => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    incrementNotificationIgnoreCounts(unreadIds)
    setOpen(false)
  }, [notifications])

  const positionPanel = useCallback(() => {
    const margin = window.innerWidth < 640 ? 8 : 16
    const top = window.innerWidth < 768 ? 64 : margin
    const panelWidth = Math.min(380, window.innerWidth - margin * 2)

    setPanelStyle({
      position: "fixed",
      top,
      right: margin,
      width: panelWidth,
      maxHeight: Math.max(280, window.innerHeight - top - margin),
    })
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        handleClosePanel()
      }
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open, handleClosePanel])

  useEffect(() => {
    if (!open) return
    positionPanel()
    window.addEventListener("resize", positionPanel)
    window.addEventListener("scroll", positionPanel, true)
    return () => {
      window.removeEventListener("resize", positionPanel)
      window.removeEventListener("scroll", positionPanel, true)
    }
  }, [open, positionPanel])

  const unreadCount = notifications.filter((n) => !n.read).length
  const panelThemeMode = isMounted ? getActivePanelThemeMode() : "light"
  const panelThemeVars = useMemo(() => getPanelThemeVariables(panelThemeMode), [panelThemeMode])

  const markRead = useCallback(
    (id: string) => {
      const next = new Set(readIds).add(id)
      setReadIds(next)
      saveReadIds(next)
      clearNotificationIgnoreCount(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    },
    [readIds]
  )

  const markAllRead = useCallback(() => {
    const next = new Set(notifications.map((n) => n.id))
    setReadIds(next)
    saveReadIds(next)
    notifications.forEach((n) => clearNotificationIgnoreCount(n.id))
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [notifications])

  useEffect(() => {
    if (unreadCount > 0) {
      const unread = notifications.find((n) => !n.read)
      if (unread && document.hidden) {
        showBrowserNotification(unread.title, { body: unread.body, tag: unread.id })
      }
    }
  }, [unreadCount, notifications])

  return (
    <div className="relative">
      <Button
        ref={btnRef}
        variant="ghost"
        size="icon"
        className="relative size-8 text-muted-foreground hover:text-foreground"
        onClick={() => {
          if (open) handleClosePanel()
          else {
            setMotivationOffset((prev) => prev + 1)
            positionPanel()
            setOpen(true)
          }
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        isMounted
          ? createPortal(
        <div
          ref={panelRef}
          style={{ ...panelStyle, ...panelThemeVars }}
          className={cn(
            "z-[120] overflow-hidden rounded-2xl border border-border bg-card shadow-xl backdrop-blur-md",
            panelThemeMode === "dark"
              ? "shadow-black/45"
              : panelThemeMode === "love"
                ? "shadow-rose-200/50"
                : "shadow-slate-200/60"
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className={cn("size-4", panelThemeMode === "dark" ? "text-emerald-300" : "text-primary")} />
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                  panelThemeMode === "dark" ? "bg-emerald-400/20 text-emerald-200" : "bg-primary/15 text-primary"
                )}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={markAllRead}
                >
                  <CheckCheck className="size-3" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                onClick={handleClosePanel}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="max-h-[460px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Bell className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onRead={() => markRead(n.id)}
                    onClose={handleClosePanel}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
          , document.body)
          : null
      )}
    </div>
  )
}

function NotificationItem({
  notification: n,
  onRead,
  onClose,
}: {
  notification: AppNotification
  onRead: () => void
  onClose: () => void
}) {
  const colorClass = TYPE_COLORS[n.type] ?? "bg-secondary text-muted-foreground"
  return (
    <div
      className={cn(
        "px-4 py-3.5 transition-colors",
        n.read ? "bg-transparent hover:bg-secondary/50" : "bg-primary/[0.04] hover:bg-primary/[0.07]"
      )}
    >
      <div
        className="flex gap-3"
        onClick={onRead}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onRead()}
      >
        <div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl text-base", colorClass)}>
          {n.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className={cn("text-[13px] font-semibold leading-tight", n.read ? "text-muted-foreground" : "text-foreground")}>
              {n.title}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              {!n.read && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />}
              {n.link && <ExternalLink className="size-3 shrink-0 text-muted-foreground/60" />}
            </div>
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize", PRIORITY_STYLES[n.priority])}>
              {n.priority}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              {n.timestamp.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>

      {n.actions && n.actions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 pl-11">
          {n.actions.slice(0, 2).map((action) =>
            action.link ? (
              <Link
                key={`${n.id}-${action.label}`}
                href={action.link}
                onClick={() => {
                  onRead()
                  onClose()
                }}
                className="rounded-md border border-border px-2 py-1 text-[10px] text-foreground hover:bg-secondary"
              >
                {action.label}
              </Link>
            ) : (
              <button
                key={`${n.id}-${action.label}`}
                type="button"
                onClick={() => {
                  if (action.markReadOnly) onRead()
                }}
                className="rounded-md border border-border px-2 py-1 text-[10px] text-foreground hover:bg-secondary"
              >
                {action.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
