"use client"

import { useEffect, useMemo, useState, type ComponentType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppData } from "@/components/data-provider"
import { NotificationCenter } from "@/components/notification-center"
import { WifeySplash } from "@/components/wifey-splash"
import { LoveCelebration } from "@/components/love-celebration"
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

function ThemeToggle({ mode, onToggle }: { mode: ThemeMode; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="size-8"
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
}: {
  mode: ThemeMode
  primaryLabel: string
  primaryTimeZone: string
  secondaryLabel: string
  secondaryTimeZone: string
}) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30 * 1000)
    return () => window.clearInterval(timer)
  }, [])

  const firstTime = formatZoneTime(resolveTimeZone(primaryTimeZone), now)
  const secondTime = formatZoneTime(resolveTimeZone(secondaryTimeZone), now)
  const firstLabel = primaryLabel.trim() || "Clock 1"
  const secondLabel = secondaryLabel.trim() || "Clock 2"

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 shadow-sm backdrop-blur-md",
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState("")
  const [pinUnlocked, setPinUnlocked] = useState(true)
  const [privacyReveal, setPrivacyReveal] = useState(false)

  const { data, updateSettings, updateSpecialCompanion, saveStatus, lastSavedAt, planName, isSpecialUser, displayName } = useAppData()
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
      setTheme(resolvedTheme === "dark" ? "light" : "dark")
      return
    }

    if (loveModeActive) {
      updateSpecialCompanion({ loveThemeEnabled: false })
      setTheme("light")
      triggerSpecialCelebration("Light theme enabled", "light")
      return
    }

    if (resolvedTheme === "light") {
      setTheme("dark")
      triggerSpecialCelebration("Dark theme enabled", "dark")
      return
    }

    if (resolvedTheme === "dark") {
      updateSpecialCompanion({ loveThemeEnabled: true })
      setTheme("light")
      triggerSpecialCelebration("Love theme enabled", "love")
      return
    }

    setTheme("light")
    triggerSpecialCelebration("Light theme enabled", "light")
  }

  return (
    <>
      {showSplash ? <WifeySplash name={displayName} /> : null}
      <LoveCelebration enabled={loveModeActive && specialCompanion.celebrationEnabled} />

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

      <div className={cn("theme-surface flex min-h-svh", loveModeActive && "love-theme")}>
        <div className="fixed right-4 top-3 z-40 hidden pointer-events-none md:block">
          <WorldClock
            mode={activeThemeMode}
            primaryLabel={data.settings.worldClockPrimaryLabel}
            primaryTimeZone={data.settings.worldClockPrimaryTimeZone}
            secondaryLabel={data.settings.worldClockSecondaryLabel}
            secondaryTimeZone={data.settings.worldClockSecondaryTimeZone}
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
            <SidebarNav items={navItems} mode={activeThemeMode} />
          </div>
          <div className="relative border-t border-border px-4 py-3">
            <div className="grid grid-cols-4 items-center gap-2">
              <div className="flex justify-center">
                <ThemeToggle mode={activeThemeMode} onToggle={handleThemeCycle} />
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
          <div className="relative flex items-center gap-1">
            <NotificationCenter />
            <ThemeToggle mode={activeThemeMode} onToggle={handleThemeCycle} />
          </div>
        </header>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
            <div className="absolute inset-0 bg-foreground/10 backdrop-blur-sm" />
            <div
              className={cn(
                "absolute left-0 top-14 bottom-0 w-[min(86vw,320px)] border-r border-border p-4",
                activeThemeMode === "light"
                  ? "bg-gradient-to-b from-yellow-50 via-orange-50 to-red-50"
                  : "bg-card"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-full flex-col">
                <SidebarNav items={navItems} mode={activeThemeMode} onNavigate={() => setMobileOpen(false)} />
                <div className="mt-4">
                  <WorldClock
                    mode={activeThemeMode}
                    primaryLabel={data.settings.worldClockPrimaryLabel}
                    primaryTimeZone={data.settings.worldClockPrimaryTimeZone}
                    secondaryLabel={data.settings.worldClockSecondaryLabel}
                    secondaryTimeZone={data.settings.worldClockSecondaryTimeZone}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/70 pt-3">
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
                <div className="mt-2 border-t border-border/70 pt-2 text-center text-[10px] text-muted-foreground">
                  Plan: {planName}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 md:ml-[240px]">
          <div className="min-h-svh pt-14 pb-6 md:pt-0 md:pb-0">
            <div className={cn("mx-auto max-w-5xl px-4 py-6 transition-all md:px-8 md:py-8", privacyModeEnabled && !privacyReveal && "blur-md")}>
              {children}
            </div>
          </div>
        </main>

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
