"use client"

import { useEffect, useMemo, useRef, useState, type ComponentType, type MouseEvent, type TouchEvent } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  CalendarClock,
  DollarSign,
  Wallet,
  Target,
  CreditCard,
  Settings,
  Moon,
  Sun,
  Zap,
  X,
  Menu,
  BarChart3,
  LogOut,
  Heart,
  BookHeart,
  Users,
  Clock3,
  Eye,
  EyeOff,
  Shield,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/components/data-provider"
import { NotificationCenter } from "@/components/notification-center"
import { WifeySplash } from "@/components/wifey-splash"
import { LoveCelebration } from "@/components/love-celebration"
import { InstallAppPrompt } from "@/components/install-app-prompt"
import { triggerSpecialCelebration } from "@/lib/special-features"
import { resolveTimeZone } from "@/lib/timezone"

const baseNavItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Shifts", href: "/shifts", icon: CalendarClock },
  { label: "Earnings", href: "/earnings", icon: DollarSign },
  { label: "Budget", href: "/budget", icon: Wallet },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Pricing", href: "/pricing", icon: CreditCard },
]

type NavItem = {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}

type ThemeMode = "light" | "dark" | "love"

function ThemeToggle({ mode, onToggle, pulsing = false }: { mode: ThemeMode; onToggle: () => void; pulsing?: boolean }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className={cn("size-8", pulsing && "theme-toggle-pulse")}
      aria-label="Toggle theme"
      title={mode === "love" ? "Love theme" : mode === "dark" ? "Dark theme" : "Light theme"}
    >
      <Sun className={cn("absolute size-4 transition-all", mode === "light" ? "rotate-0 scale-100" : "-rotate-90 scale-0")} />
      <Moon className={cn("absolute size-4 transition-all", mode === "dark" ? "rotate-0 scale-100" : "rotate-90 scale-0")} />
      <Heart className={cn("absolute size-4 transition-all", mode === "love" ? "scale-100 text-rose-500" : "scale-0")} />
    </Button>
  )
}

function SidebarNav({ items, mode, onNavigate }: { items: NavItem[]; mode: ThemeMode; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              isActive
                ? mode === "light"
                  ? "bg-gradient-to-r from-yellow-200/80 via-orange-200/80 to-red-200/75 text-orange-900 shadow-sm"
                  : "bg-primary/10 text-primary"
                : mode === "light"
                  ? "text-muted-foreground hover:bg-gradient-to-r hover:from-yellow-100/70 hover:via-orange-100/70 hover:to-red-100/65 hover:text-orange-900"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="size-[18px] shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function formatZoneTime(timeZone: string, date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

function WorldClock({
  mode,
  primaryLabel,
  primaryTimeZone,
  secondaryLabel,
  secondaryTimeZone,
  draggable = false,
}: {
  mode: ThemeMode
  primaryLabel: string
  primaryTimeZone: string
  secondaryLabel: string
  secondaryTimeZone: string
  draggable?: boolean
}) {
  const [now, setNow] = useState(() => new Date())
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null)
  const storageKey = "shiftwise:world-clock-position"

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30 * 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!draggable) return
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as { x?: number; y?: number }
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        setPosition({ x: parsed.x, y: parsed.y })
      }
    } catch {
      // Ignore invalid persisted positions.
    }
  }, [draggable])

  useEffect(() => {
    if (!draggable || !position) return
    window.localStorage.setItem(storageKey, JSON.stringify(position))
  }, [draggable, position])

  useEffect(() => {
    if (!draggable) return

    const clampPosition = (nextX: number, nextY: number) => {
      const card = cardRef.current
      const width = card?.offsetWidth ?? 260
      const height = card?.offsetHeight ?? 100
      const margin = 12
      const maxX = Math.max(margin, window.innerWidth - width - margin)
      const maxY = Math.max(margin, window.innerHeight - height - margin)
      return {
        x: Math.min(Math.max(nextX, margin), maxX),
        y: Math.min(Math.max(nextY, margin), maxY),
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      const dragOffset = dragOffsetRef.current
      if (!dragOffset) return
      const next = clampPosition(event.clientX - dragOffset.x, event.clientY - dragOffset.y)
      setPosition(next)
    }

    const handlePointerUp = () => {
      dragOffsetRef.current = null
      setDragging(false)
    }

    const handleResize = () => {
      if (!position) return
      const clamped = clampPosition(position.x, position.y)
      if (clamped.x !== position.x || clamped.y !== position.y) {
        setPosition(clamped)
      }
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("resize", handleResize)
    }
  }, [draggable, position])

  const firstTime = formatZoneTime(resolveTimeZone(primaryTimeZone), now)
  const secondTime = formatZoneTime(resolveTimeZone(secondaryTimeZone), now)
  const firstLabel = primaryLabel.trim() || "Clock 1"
  const secondLabel = secondaryLabel.trim() || "Clock 2"

  return (
    <div
      ref={cardRef}
      onPointerDown={(event) => {
        if (!draggable || event.button !== 0) return
        const rect = cardRef.current?.getBoundingClientRect()
        if (!rect) return
        dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
        setDragging(true)
      }}
      style={
        draggable
          ? {
              position: "fixed",
              left: position ? `${position.x}px` : undefined,
              top: position ? `${position.y}px` : "12px",
              right: position ? undefined : "16px",
              zIndex: 40,
              cursor: dragging ? "grabbing" : "grab",
            }
          : undefined
      }
      className={cn(
        "rounded-xl border px-3 py-2 shadow-sm backdrop-blur-md",
        draggable && "select-none",
        mode === "light"
          ? "border-orange-300/50 bg-white/90"
          : "border-border bg-card/90"
      )}
    >
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Clock3 className="size-3" />
        World Clock
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-muted-foreground">{firstLabel}</span>
          <span className="font-semibold text-foreground">{firstTime}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-muted-foreground">{secondLabel}</span>
          <span className="font-semibold text-foreground">{secondTime}</span>
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const [themeFlashMode, setThemeFlashMode] = useState<ThemeMode | null>(null)
  const [themeTogglePulse, setThemeTogglePulse] = useState(false)
  const [routeTransitioning, setRouteTransitioning] = useState(false)
  const [networkOnline, setNetworkOnline] = useState(true)
  const [networkRecovering, setNetworkRecovering] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState("")
  const [pinUnlocked, setPinUnlocked] = useState(true)
  const [privacyReveal, setPrivacyReveal] = useState(false)
  const themeFlashTimeoutRef = useRef<number | ReturnType<typeof setTimeout> | null>(null)
  const themePulseTimeoutRef = useRef<number | ReturnType<typeof setTimeout> | null>(null)
  const routeTransitionTimeoutRef = useRef<number | ReturnType<typeof setTimeout> | null>(null)
  const swipeTouchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const hasPathnameInitializedRef = useRef(false)

  const { data, updateSettings, updateSpecialCompanion, saveStatus, lastSavedAt, planName, isSpecialUser, displayName, refreshPlan } = useAppData()
  const currencyOptions = ["AUD", "USD", "CAD", "EUR", "GBP"] as const

  const specialCompanion = data.settings.specialCompanion
  const loveModeActive = isSpecialUser && specialCompanion.loveThemeEnabled

  const specialNavItems = useMemo<NavItem[]>(() => {
    if (!loveModeActive) return []
    return [
      { label: "Wifey Routine", href: "/wifey-routine", icon: BookHeart },
      { label: "Couple Dash", href: "/couple-dashboard", icon: Users },
    ]
  }, [loveModeActive])

  const studentParentNavItems = useMemo<NavItem[]>(() => {
    if (isSpecialUser) return []
    return [
      { label: "Student Routine", href: "/wifey-routine", icon: BookHeart },
      { label: "Parent Dash", href: "/couple-dashboard", icon: Users },
    ]
  }, [isSpecialUser])

  const settingsNavItem = useMemo<NavItem>(() => ({ label: "Settings", href: "/settings", icon: Settings }), [])
  const navItems = useMemo<NavItem[]>(() => {
    return [...baseNavItems, ...specialNavItems, ...studentParentNavItems, settingsNavItem]
  }, [settingsNavItem, specialNavItems, studentParentNavItems])
  const mobileNavSections = useMemo<Array<{ label: string; items: NavItem[] }>>(() => {
    const sections: Array<{ label: string; items: NavItem[] }> = [{ label: "Core", items: baseNavItems }]
    if (specialNavItems.length > 0) {
      sections.push({ label: "Companion", items: specialNavItems })
    }
    if (studentParentNavItems.length > 0) {
      sections.push({ label: "Student", items: studentParentNavItems })
    }
    sections.push({ label: "Preferences", items: [settingsNavItem] })
    return sections
  }, [settingsNavItem, specialNavItems, studentParentNavItems])
  const swipeRoutes = useMemo(() => {
    return [
      "/",
      "/shifts",
      "/earnings",
      "/budget",
      "/goals",
      "/analytics",
      ...(specialNavItems.length > 0 || studentParentNavItems.length > 0 ? ["/wifey-routine", "/couple-dashboard"] : []),
    ]
  }, [specialNavItems.length, studentParentNavItems.length])

  const requiresPin = isSpecialUser && specialCompanion.pinEnabled && specialCompanion.pinCode.trim().length > 0
  const privacyModeEnabled = isSpecialUser && specialCompanion.privacyMode
  const activeThemeMode: ThemeMode = loveModeActive ? "love" : resolvedTheme === "dark" ? "dark" : "light"

  useEffect(() => {
    if (!requiresPin) {
      setPinUnlocked(true)
      return
    }

    try {
      const unlocked = sessionStorage.getItem("shiftwise:wifey-pin-unlocked") === "1"
      setPinUnlocked(unlocked)
    } catch {
      setPinUnlocked(false)
    }
  }, [requiresPin])

  useEffect(() => {
    if (!loveModeActive) {
      setShowSplash(false)
      return
    }

    try {
      const shown = sessionStorage.getItem("shiftwise:wifey-splash-shown")
      if (shown === "1") {
        setShowSplash(false)
        return
      }

      setShowSplash(true)
      const timeout = window.setTimeout(() => {
        setShowSplash(false)
        sessionStorage.setItem("shiftwise:wifey-splash-shown", "1")
      }, 1800)

      return () => window.clearTimeout(timeout)
    } catch {
      setShowSplash(false)
    }
  }, [loveModeActive])

  useEffect(() => {
    if (!privacyModeEnabled) {
      setPrivacyReveal(false)
    }
  }, [privacyModeEnabled])

  useEffect(() => {
    return () => {
      if (themeFlashTimeoutRef.current) clearTimeout(themeFlashTimeoutRef.current)
      if (themePulseTimeoutRef.current) clearTimeout(themePulseTimeoutRef.current)
      if (routeTransitionTimeoutRef.current) clearTimeout(routeTransitionTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    setNetworkOnline(window.navigator.onLine)

    const handleOffline = () => {
      setNetworkOnline(false)
      setNetworkRecovering(false)
    }

    const handleOnline = () => {
      setNetworkOnline(true)
      setNetworkRecovering(true)
      void refreshPlan()
      window.setTimeout(() => setNetworkRecovering(false), 2200)
    }

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [refreshPlan])

  useEffect(() => {
    const routesToPrefetch = Array.from(new Set([...navItems.map((item) => item.href), ...swipeRoutes]))
    routesToPrefetch.forEach((route) => {
      void router.prefetch(route)
    })
  }, [navItems, router, swipeRoutes])

  useEffect(() => {
    if (!hasPathnameInitializedRef.current) {
      hasPathnameInitializedRef.current = true
      return
    }

    setRouteTransitioning(true)
    if (routeTransitionTimeoutRef.current) clearTimeout(routeTransitionTimeoutRef.current)
    routeTransitionTimeoutRef.current = window.setTimeout(() => {
      setRouteTransitioning(false)
    }, 220)
  }, [pathname])

  const beginRouteTransition = () => {
    setRouteTransitioning(true)
    if (routeTransitionTimeoutRef.current) clearTimeout(routeTransitionTimeoutRef.current)
    routeTransitionTimeoutRef.current = window.setTimeout(() => {
      setRouteTransitioning(false)
    }, 1200)
  }

  const handleMobileNav = () => {
    beginRouteTransition()
    setMobileOpen(false)
  }

  const handleMainClickCapture = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    const anchor = target.closest("a[href]") as HTMLAnchorElement | null
    if (!anchor) return
    const href = anchor.getAttribute("href")
    if (!href || !href.startsWith("/") || href.startsWith("//")) return
    if (href === pathname) return
    beginRouteTransition()
  }

  const handleMainTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (typeof window === "undefined" || window.innerWidth >= 768 || mobileOpen) return
    const target = event.target as HTMLElement
    if (target.closest("input, textarea, select, button, [role='button'], [data-no-swipe='true']")) return
    const touch = event.touches[0]
    swipeTouchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
  }

  const handleMainTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (typeof window === "undefined" || window.innerWidth >= 768 || mobileOpen) return
    const start = swipeTouchStartRef.current
    swipeTouchStartRef.current = null
    if (!start) return

    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    const elapsed = Date.now() - start.time

    if (elapsed > 700) return
    if (Math.abs(dx) < 90) return
    if (Math.abs(dx) < Math.abs(dy) * 1.35) return

    const currentIndex = swipeRoutes.indexOf(pathname)
    if (currentIndex === -1) return

    const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1
    if (nextIndex < 0 || nextIndex >= swipeRoutes.length) return

    beginRouteTransition()
    router.push(swipeRoutes[nextIndex])
  }

  const runThemeTransitionFeedback = (mode: ThemeMode) => {
    setThemeFlashMode(mode)
    setThemeTogglePulse(true)

    if (themeFlashTimeoutRef.current) clearTimeout(themeFlashTimeoutRef.current)
    if (themePulseTimeoutRef.current) clearTimeout(themePulseTimeoutRef.current)

    themePulseTimeoutRef.current = setTimeout(() => {
      setThemeTogglePulse(false)
    }, 260)

    themeFlashTimeoutRef.current = setTimeout(() => {
      setThemeFlashMode(null)
    }, 520)

    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(16)
      }
    } catch {
      // Ignore vibration API failures.
    }
  }

  const handleCurrencyCycle = () => {
    const currentIndex = currencyOptions.indexOf(data.settings.currency as (typeof currencyOptions)[number])
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % currencyOptions.length : 0
    const nextCurrency = currencyOptions[nextIndex]
    const symbolByCode: Record<(typeof currencyOptions)[number], string> = {
      AUD: "A$",
      USD: "US$",
      CAD: "C$",
      EUR: "€",
      GBP: "£",
    }
    updateSettings({ currency: nextCurrency, currencySymbol: symbolByCode[nextCurrency] })
  }

  const handlePinUnlock = () => {
    if (pinInput.trim() === specialCompanion.pinCode) {
      setPinUnlocked(true)
      setPinError("")
      setPinInput("")
      try {
        sessionStorage.setItem("shiftwise:wifey-pin-unlocked", "1")
      } catch {
        // Ignore storage errors for lock state.
      }
      triggerSpecialCelebration("Pin unlock successful")
      return
    }

    setPinError("Wrong pin. Try again.")
  }

  const handleThemeCycle = () => {
    if (!isSpecialUser) {
      const nextMode: ThemeMode = resolvedTheme === "dark" ? "light" : "dark"
      setTheme(nextMode)
      runThemeTransitionFeedback(nextMode)
      return
    }

    if (loveModeActive) {
      updateSpecialCompanion({ loveThemeEnabled: false })
      setTheme("light")
      runThemeTransitionFeedback("light")
      triggerSpecialCelebration("Light theme enabled", "light")
      return
    }

    if (resolvedTheme === "light") {
      setTheme("dark")
      runThemeTransitionFeedback("dark")
      triggerSpecialCelebration("Dark theme enabled", "dark")
      return
    }

    if (resolvedTheme === "dark") {
      updateSpecialCompanion({ loveThemeEnabled: true })
      setTheme("light")
      runThemeTransitionFeedback("love")
      triggerSpecialCelebration("Love theme enabled", "love")
      return
    }

    setTheme("light")
    runThemeTransitionFeedback("light")
    triggerSpecialCelebration("Light theme enabled", "light")
  }

  return (
    <>
      {showSplash ? <WifeySplash name={displayName} /> : null}
      <LoveCelebration enabled={loveModeActive && specialCompanion.celebrationEnabled} />
      {themeFlashMode ? (
        <div
          className={cn(
            "theme-flash-overlay pointer-events-none fixed inset-0 z-[111]",
            themeFlashMode === "light" && "theme-flash-light",
            themeFlashMode === "dark" && "theme-flash-dark",
            themeFlashMode === "love" && "theme-flash-love"
          )}
          aria-hidden
        />
      ) : null}

      {requiresPin && !pinUnlocked ? (
        <div className="fixed inset-0 z-[125] flex items-center justify-center bg-background/95 px-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <Shield className="size-5" />
              <h2 className="text-lg font-semibold">Unlock for {displayName}</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">Enter your personal pin to open your dashboard without typing full login each time.</p>
            <div className="space-y-3">
              <Input
                inputMode="numeric"
                type="password"
                placeholder="Enter pin"
                value={pinInput}
                onChange={(event) => setPinInput(event.target.value.replace(/\D/g, "").slice(0, 8))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handlePinUnlock()
                  }
                }}
                autoFocus
              />
              {pinError ? <p className="text-sm text-destructive">{pinError}</p> : null}
              <Button className="w-full" onClick={handlePinUnlock}>Unlock</Button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={cn("theme-surface flex min-h-svh", loveModeActive && "love-theme")}
        data-special-user={isSpecialUser ? "true" : "false"}
      >
        {!networkOnline || networkRecovering ? (
          <div className="fixed left-0 right-0 top-14 z-[113] px-3 md:left-[240px] md:top-3 md:px-6">
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs shadow-sm backdrop-blur-md",
                networkOnline
                  ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                  : "border-amber-300/60 bg-amber-500/10 text-amber-700 dark:text-amber-200"
              )}
            >
              {networkRecovering ? <Loader2 className="size-3.5 animate-spin" /> : null}
              <span>
                {networkOnline
                  ? "Back online. Retrying sync."
                  : "Offline mode. Changes save locally and retry when online."}
              </span>
            </div>
          </div>
        ) : null}
        {routeTransitioning ? (
          <div className="route-transition-overlay pointer-events-none fixed inset-0 z-[112] md:left-[240px]" aria-hidden />
        ) : null}
        <div className="hidden md:block">
          <WorldClock
            mode={activeThemeMode}
            primaryLabel={data.settings.worldClockPrimaryLabel}
            primaryTimeZone={data.settings.worldClockPrimaryTimeZone}
            secondaryLabel={data.settings.worldClockSecondaryLabel}
            secondaryTimeZone={data.settings.worldClockSecondaryTimeZone}
            draggable
          />
        </div>
        {/* Desktop sidebar */}
        <aside className={cn(
          "hidden border-r border-border md:fixed md:inset-y-0 md:flex md:w-[240px] md:flex-col",
          activeThemeMode === "light"
            ? "bg-gradient-to-b from-yellow-50 via-orange-50 to-red-50"
            : "bg-card"
        )}>
          <div className="flex h-14 items-center gap-2.5 px-5">
            <div className={cn(
              "flex size-7 items-center justify-center rounded-lg",
              loveModeActive
                ? "bg-gradient-to-br from-primary to-accent"
                : activeThemeMode === "light"
                  ? "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500"
                  : "bg-primary"
            )}>
              {loveModeActive ? <Heart className="size-4 text-white" /> : <Zap className={cn("size-4", activeThemeMode === "light" ? "text-white" : "text-primary-foreground")} />}
            </div>
            <span className="text-sm font-semibold text-foreground">
              {loveModeActive ? `ShiftWise x ${displayName}` : "ShiftWise"}
            </span>
          </div>
          <div className="flex flex-1 flex-col px-3 py-2">
            {loveModeActive ? (
              <div className="mb-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-accent/30 px-3 py-2 text-xs text-muted-foreground">
                Welcome wifey.
              </div>
            ) : null}
            <SidebarNav items={navItems} mode={activeThemeMode} onNavigate={beginRouteTransition} />
          </div>
          <div className="relative border-t border-border px-4 py-3">
            <div className="grid grid-cols-4 items-center gap-2">
              <div className="flex justify-center">
                <ThemeToggle mode={activeThemeMode} onToggle={handleThemeCycle} pulsing={themeTogglePulse} />
              </div>
              <div className="flex justify-center">
                <NotificationCenter />
              </div>
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCurrencyCycle}
                  className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  aria-label="Change currency"
                  title="Click to change currency"
                >
                  {data.settings.currency}
                </Button>
              </div>
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="size-8 text-muted-foreground hover:text-foreground"
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
              <div className="col-span-4 flex justify-center border-t border-border pt-2 text-[10px] text-muted-foreground">
                {saveStatus === "saving" && "Saving..."}
                {saveStatus === "saved" && `Saved ${lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}`}
                {saveStatus === "error" && "Save failed"}
                {saveStatus === "idle" && "Ready"}
              </div>
              <div className="col-span-4 flex justify-center text-[10px] text-muted-foreground">
                Plan: {planName}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile header */}
        <header className={cn(
          "fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border px-4 backdrop-blur-md md:hidden",
          activeThemeMode === "light"
            ? "bg-gradient-to-r from-yellow-50/90 via-orange-50/90 to-red-50/90"
            : "bg-card/80"
        )}>
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 -ml-1.5"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
            <div className={cn(
              "flex size-7 items-center justify-center rounded-lg",
              loveModeActive
                ? "bg-gradient-to-br from-primary to-accent"
                : activeThemeMode === "light"
                  ? "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500"
                  : "bg-primary"
            )}>
              {loveModeActive ? <Heart className="size-4 text-white" /> : <Zap className={cn("size-4", activeThemeMode === "light" ? "text-white" : "text-primary-foreground")} />}
            </div>
            <span className="max-w-[140px] truncate text-sm font-semibold text-foreground">{loveModeActive ? `${displayName}'s ShiftWise` : "ShiftWise"}</span>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Menu</span>
        </header>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
            <div className="absolute inset-0 bg-foreground/10 backdrop-blur-sm" />
            <div
              className={cn(
                "absolute left-0 top-14 bottom-0 w-[min(90vw,340px)] border-r border-border p-4",
                activeThemeMode === "light"
                  ? "bg-gradient-to-b from-yellow-50 via-orange-50 to-red-50"
                  : "bg-card"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-full flex-col">
                <div className="rounded-xl border border-border/70 bg-card/70 p-2.5">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Quick controls</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex justify-center">
                      <ThemeToggle mode={activeThemeMode} onToggle={handleThemeCycle} pulsing={themeTogglePulse} />
                    </div>
                    <div className="flex justify-center">
                      <NotificationCenter />
                    </div>
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCurrencyCycle}
                        className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        aria-label="Change currency"
                        title="Change currency"
                      >
                        {data.settings.currency}
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="size-8 text-muted-foreground hover:text-foreground"
                        aria-label="Sign out"
                      >
                        <LogOut className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex-1 overflow-y-auto pr-1">
                  <div className="space-y-4">
                    {mobileNavSections.map((section) => (
                      <div key={section.label} className="space-y-1.5">
                        <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {section.label}
                        </p>
                        <SidebarNav items={section.items} mode={activeThemeMode} onNavigate={handleMobileNav} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <WorldClock
                      mode={activeThemeMode}
                      primaryLabel={data.settings.worldClockPrimaryLabel}
                      primaryTimeZone={data.settings.worldClockPrimaryTimeZone}
                      secondaryLabel={data.settings.worldClockSecondaryLabel}
                      secondaryTimeZone={data.settings.worldClockSecondaryTimeZone}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border/70 pt-3">
                    <div className="flex items-center text-[11px] text-muted-foreground">
                      {saveStatus === "saving" && "Saving..."}
                      {saveStatus === "saved" && "Saved"}
                      {saveStatus === "error" && "Save failed"}
                      {saveStatus === "idle" && "Ready"}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() => setMobileOpen(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 border-t border-border/70 pt-2 text-center text-[10px] text-muted-foreground">
                    Plan: {planName}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 md:ml-[240px]">
          <div className="min-h-svh pt-14 pb-6 md:pt-0 md:pb-0">
            <div
              className={cn(
                "mx-auto w-full max-w-5xl px-3 py-4 transition-all sm:px-4 sm:py-6 md:px-8 md:py-8",
                privacyModeEnabled && !privacyReveal && "blur-md",
                routeTransitioning && "opacity-85"
              )}
              onClickCapture={handleMainClickCapture}
              onTouchStart={handleMainTouchStart}
              onTouchEnd={handleMainTouchEnd}
            >
              {children}
            </div>
          </div>
        </main>
        <InstallAppPrompt />

        {privacyModeEnabled ? (
          <div className="fixed bottom-6 right-4 z-[110] md:right-6">
            <Button
              type="button"
              onClick={() => {
                setPrivacyReveal((prev) => !prev)
                triggerSpecialCelebration("Privacy reveal toggled")
              }}
              className="gap-2 rounded-full"
              variant={privacyReveal ? "outline" : "default"}
            >
              {privacyReveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {privacyReveal ? "Hide again" : "Reveal for now"}
            </Button>
          </div>
        ) : null}
      </div>
    </>
  )
}
