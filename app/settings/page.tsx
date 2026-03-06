"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, CalendarClock, ChevronDown, ChevronUp, Copy, Database, Globe2, Heart, Info, LayoutDashboard, Loader2, PawPrint, RefreshCw, Shield, UserRound, WalletCards } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

import { AppShell } from "@/components/app-shell"
import { useAppData } from "@/components/data-provider"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { triggerSpecialCelebration } from "@/lib/special-features"
import { resolveTimeZone } from "@/lib/timezone"
import { BiometricPrompt } from "@/components/biometric-prompt"

type SubscriptionStatus = {
  paypalSubscriptionId: string
  paypalPlanId: string
  paypalCurrentPeriodEnd: string
  status: string
  cancelAtPeriodEnd: boolean
  updatedAt: string
  planName: string
}

const TIME_ZONE_OPTIONS = [
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Vancouver",
  "America/Whitehorse",
  "America/Dawson",
  "America/Los_Angeles",
  "America/Tijuana",
  "America/Edmonton",
  "America/Cambridge_Bay",
  "America/Inuvik",
  "America/Yellowknife",
  "America/Calgary",
  "America/Denver",
  "America/Phoenix",
  "America/Chicago",
  "America/Winnipeg",
  "America/Rankin_Inlet",
  "America/Resolute",
  "America/Regina",
  "America/Swift_Current",
  "America/Toronto",
  "America/Nipigon",
  "America/Thunder_Bay",
  "America/Iqaluit",
  "America/Pangnirtung",
  "America/Atikokan",
  "America/Creston",
  "America/Fort_Nelson",
  "America/Blanc-Sablon",
  "America/Moncton",
  "America/Halifax",
  "America/Glace_Bay",
  "America/Goose_Bay",
  "America/St_Johns",
  "America/New_York",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Atlantic/Reykjavik",
  "Europe/Dublin",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Zurich",
  "Europe/Stockholm",
  "Europe/Athens",
  "Europe/Helsinki",
  "Europe/Istanbul",
  "Europe/Moscow",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Asia/Jerusalem",
  "Asia/Riyadh",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kathmandu",
  "Asia/Dhaka",
  "Asia/Colombo",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Taipei",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Asia/Manila",
  "Asia/Jakarta",
  "Asia/Ho_Chi_Minh",
  "Asia/Kuala_Lumpur",
  "Asia/Novosibirsk",
  "Australia/Perth",
  "Australia/Darwin",
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Sydney",
  "Australia/Hobart",
  "Pacific/Auckland",
  "Pacific/Fiji",
  "UTC",
]

export default function SettingsPage() {
  const { data, updateSettings, planName, updateSpecialCompanion, isSpecialUser, displayName } = useAppData()
  const { toast } = useToast()
  const [resetting, setResetting] = useState(false)
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [managingSubscription, setManagingSubscription] = useState<"cancel" | "reactivate" | null>(null)
  const [specialPin, setSpecialPin] = useState(data.settings.specialCompanion.pinCode)
  // Collapsible states
  const [notifTypesOpen, setNotifTypesOpen] = useState(false)
  const [widgetsOpen, setWidgetsOpen] = useState(false)
  const { data: session, update: updateSession } = useSession()
  const [profile, setProfile] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || ""
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const companionWaterGoal = (() => {
    const parsed = Number(data.settings.specialCompanion.waterBottleGoal)
    if (!Number.isFinite(parsed)) return 8
    return Math.max(4, Math.min(12, Math.round(parsed)))
  })()

  const loadSubscriptionStatus = async () => {
    setLoadingSubscription(true)
    setSubscriptionError(null)
    try {
      const response = await fetch("/api/subscription/status", { cache: "no-store" })
      const payload = (await response.json()) as {
        hasSubscription?: boolean
        subscription?: SubscriptionStatus | null
        error?: string
      }

      if (!response.ok) {
        setSubscriptionError(payload.error ?? "Could not load subscription status.")
        setSubscription(null)
        return
      }

      setSubscription(payload.hasSubscription ? payload.subscription ?? null : null)
    } catch (error) {
      console.error("Failed to load subscription status:", error)
      setSubscriptionError("Could not load subscription status due to a network issue.")
      setSubscription(null)
    } finally {
      setLoadingSubscription(false)
    }
  }

  useEffect(() => {
    void loadSubscriptionStatus()
  }, [])

  useEffect(() => {
    setSpecialPin(data.settings.specialCompanion.pinCode)
  }, [data.settings.specialCompanion.pinCode])

  const manageSubscription = async (action: "cancel" | "reactivate") => {
    setManagingSubscription(action)
    try {
      const key = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`

      const response = await fetch("/api/subscription/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": key,
        },
        body: JSON.stringify({ action }),
      })

      const payload = (await response.json()) as { ok?: boolean; message?: string; error?: string }
      if (!response.ok) {
        toast({
          title: "Subscription update failed",
          description: payload.error ?? "Please retry in a moment.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: action === "cancel" ? "Cancellation scheduled" : "Auto-renew enabled",
        description: payload.message ?? "Subscription updated successfully.",
      })
      await loadSubscriptionStatus()
    } catch (error) {
      console.error("Failed to manage subscription:", error)
      toast({
        title: "Network error",
        description: "Could not update your subscription right now.",
        variant: "destructive",
      })
    } finally {
      setManagingSubscription(null)
    }
  }

  const copySubscriptionId = async () => {
    if (!subscription?.paypalSubscriptionId) return
    try {
      await navigator.clipboard.writeText(subscription.paypalSubscriptionId)
      toast({
        title: "Subscription ID copied",
        description: "Copied to clipboard for support cases.",
      })
    } catch (error) {
      console.error("Failed to copy subscription ID:", error)
      toast({
        title: "Copy failed",
        description: "Could not copy subscription ID.",
        variant: "destructive",
      })
    }
  }

  function handleProfileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setProfile((p: { name: string; email: string }) => ({ ...p, [name]: value }))
  }

  async function handleProfileSave() {
    setSavingProfile(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "Profile update failed",
          description: result.error || "Please try again later.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Profile updated",
        description: "Your details have been saved."
      })

      // Update local context
      if (result.user && result.user.name) {
        void updateSession({ name: result.user.name, email: result.user.email })
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: "Network error",
        description: "Could not save profile at this time.",
        variant: "destructive"
      })
    } finally {
      setSavingProfile(false)
    }
  }

  function handleReset() {
    setResetting(true)
    setTimeout(() => {
      localStorage.clear()
      window.location.reload()
    }, 800)
  }

  function handleSaveSpecialPin() {
    const cleaned = specialPin.trim()
    if (cleaned.length > 0 && !/^\d{4,8}$/.test(cleaned)) {
      toast({
        title: "Invalid pin",
        description: "Use a 4 to 8 digit numeric pin.",
        variant: "destructive",
      })
      return
    }

    updateSpecialCompanion({
      pinCode: cleaned,
      pinEnabled: cleaned.length >= 4,
    })
    triggerSpecialCelebration("PIN updated")
  }

  const currencyOptions = [
    { code: "AUD", symbol: "A$" },
    { code: "USD", symbol: "US$" },
    { code: "CAD", symbol: "C$" },
    { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" },
  ]

  const payPeriodOptions = [
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Biweekly" },
    { value: "monthly", label: "Monthly" },
    { value: "per_shift", label: "Per shift" },
  ]

  const countryOptions = [
    { value: "Australia", label: "Australia", currency: "AUD", symbol: "A$" },
    { value: "USA", label: "USA", currency: "USD", symbol: "US$" },
    { value: "UK", label: "UK", currency: "GBP", symbol: "£" },
    { value: "Other", label: "Other", currency: "AUD", symbol: "A$" },
  ]
  const handleCountryChange = (v: string) => {
    const country = countryOptions.find(c => c.value === v)
    if (!country) return
    updateSettings({ country: v, currency: country.currency, currencySymbol: country.symbol })
  }
  const selectedTimeZone = resolveTimeZone(data.settings.timeZone)
  const timeZoneSelectOptions = useMemo(
    () => (TIME_ZONE_OPTIONS.includes(selectedTimeZone) ? TIME_ZONE_OPTIONS : [selectedTimeZone, ...TIME_ZONE_OPTIONS]),
    [selectedTimeZone]
  )
  const worldClockPrimaryZone = resolveTimeZone(data.settings.worldClockPrimaryTimeZone)
  const worldClockSecondaryZone = resolveTimeZone(data.settings.worldClockSecondaryTimeZone)
  const worldClockZoneOptions = useMemo<string[]>(() => {
    const items = [worldClockPrimaryZone, worldClockSecondaryZone, ...TIME_ZONE_OPTIONS]
    return Array.from(new Set(items))
  }, [worldClockPrimaryZone, worldClockSecondaryZone])
  const selectedTimeZoneNow = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: selectedTimeZone,
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date())
    } catch {
      return "Unavailable"
    }
  }, [selectedTimeZone])

  const notificationTypeOptions = [
    { value: "shift", label: "Shift reminders" },
    { value: "budget", label: "Budget alerts" },
    { value: "goal", label: "Goal reminders" },
    { value: "earnings", label: "Earnings milestones" },
    { value: "payday", label: "Payday reminders" },
    { value: "motivation", label: "Daily motivation" },
    { value: "milestone", label: "Goal milestones" },
    ...(isSpecialUser ? [{ value: "special", label: "Wifey reminders" }] : []),
  ]
  const dashboardWidgetOptions: Array<{
    key: keyof typeof data.settings.dashboardWidgets
    label: string
  }> = [
      { key: "quickActions", label: "Quick actions" },
      { key: "profitability", label: "Job profitability" },
      { key: "stats", label: "Stats cards" },
      { key: "weeklyChart", label: "Weekly earnings chart" },
      { key: "jobBreakdown", label: "Job breakdown chart" },
      { key: "upcomingShifts", label: "Upcoming shifts" },
    ]
  const isLifetimePlan = Boolean(
    subscription &&
    (subscription.status.toLowerCase() === "lifetime" || subscription.planName.toLowerCase().includes("lifetime"))
  )

  return (
    <AppShell>
      <div className="mobile-page mobile-settings mx-auto flex w-full max-w-6xl flex-col gap-6 py-6 md:gap-8 md:py-10">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/8 via-card to-card shadow-sm">
          <CardHeader className="space-y-3 p-5 md:space-y-4 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Settings</h1>
              <Badge variant="secondary" className="hidden rounded-full px-2.5 py-1 text-[10px] sm:inline-flex sm:px-3 sm:text-xs">
                Account & App Settings
              </Badge>
            </div>
            <CardDescription className="text-sm md:text-base">
              Manage profile, billing, notifications, regional settings, and dashboard preferences in one place.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="mobile-settings-grid grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-8 lg:col-span-8">
            <div className="mobile-settings-group rounded-xl border border-border/70 bg-muted/20 p-4 md:p-5">
              <div className="mb-4 border-b border-border/60 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Account</h2>
                <p className="mt-1 text-xs text-muted-foreground">Identity details for this device.</p>
              </div>
              <div className="space-y-5">
                <Card id="settings-profile" className="mobile-settings-card border-border/80 shadow-sm">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center gap-2">
                      <UserRound className="text-primary size-4" />
                      <CardTitle className="text-lg">Profile</CardTitle>
                    </div>
                    <CardDescription>Stored locally on this device.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 p-6 pt-0">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name">Name</Label>
                      <Input
                        id="profile-name"
                        name="name"
                        type="text"
                        value={profile.name}
                        onChange={handleProfileChange}
                        placeholder="Your name"
                        autoComplete="name"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-email">Email</Label>
                      <Input
                        id="profile-email"
                        name="email"
                        type="email"
                        value={profile.email}
                        onChange={handleProfileChange}
                        placeholder="you@email.com"
                        autoComplete="email"
                        className="h-10"
                      />
                    </div>
                    <Button onClick={handleProfileSave} disabled={savingProfile} className="w-full sm:w-fit gap-2">
                      {savingProfile && <Loader2 className="size-4 animate-spin" />}
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
            {/* Universal Security & Privacy section */}
            <div className="mobile-settings-group rounded-xl border border-border/70 bg-muted/20 p-4 md:p-5">
              <div className="mb-4 border-b border-border/60 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Security & Privacy</h2>
                <p className="mt-1 text-xs text-muted-foreground">App locking and privacy controls.</p>
              </div>
              <div className="space-y-5">
                <Card id="settings-security" className="mobile-settings-card border-border/80 shadow-sm border-primary/20">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="text-primary size-4" />
                      <CardTitle className="text-lg">Access Lock</CardTitle>
                    </div>
                    <CardDescription>Secure your data with a personal PIN or biometrics.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6 pt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Biometric Unlock</Label>
                          <p className="text-xs text-muted-foreground">Use Face ID or Touch ID to unlock.</p>
                        </div>
                        <Switch
                          checked={data.settings.specialCompanion.biometricsEnabled}
                          onCheckedChange={(checked) => updateSpecialCompanion({ biometricsEnabled: Boolean(checked) })}
                        />
                      </div>
                      {data.settings.specialCompanion.biometricsEnabled && session?.user?.id && (
                        <div className="rounded-lg border border-primary/10 bg-primary/5 p-3">
                          <BiometricPrompt
                            onSuccess={() => {
                              toast({ title: "Biometrics verified", description: "Your device is now linked." })
                            }}
                            userId={session.user.id}
                            userName={displayName}
                          />
                        </div>
                      )}

                      <Separator className="opacity-50" />

                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Privacy mode</p>
                          <p className="text-xs text-muted-foreground">Blur dashboard content until manually revealed.</p>
                        </div>
                        <Switch
                          checked={data.settings.specialCompanion.privacyMode}
                          onCheckedChange={(checked) => {
                            updateSpecialCompanion({ privacyMode: Boolean(checked) })
                          }}
                        />
                      </div>

                      <Separator className="opacity-50" />

                      <div className="space-y-3">
                        <Label htmlFor="app-pin">Personal PIN (4-8 digits)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="app-pin"
                            type="password"
                            inputMode="numeric"
                            placeholder="Set a pin"
                            value={specialPin}
                            onChange={(e) => setSpecialPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                          />
                          <Button onClick={handleSaveSpecialPin}>Save</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Enable PIN Lock</Label>
                          <Switch
                            checked={data.settings.specialCompanion.pinEnabled}
                            onCheckedChange={(checked) => {
                              if (checked && data.settings.specialCompanion.pinCode.trim().length < 4) {
                                toast({ title: "Pin required", description: "Save a 4-8 digit pin first.", variant: "destructive" })
                                return
                              }
                              updateSpecialCompanion({ pinEnabled: Boolean(checked) })
                            }}
                          />
                        </div>
                      </div>

                      <Separator className="opacity-50" />
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-primary/20 hover:bg-primary/5"
                          onClick={() => {
                            sessionStorage.removeItem("shiftwise:wifey-pin-unlocked")
                            window.location.reload()
                          }}
                        >
                          <Shield className="size-4" />
                          Lock App Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mobile-settings-group rounded-xl border border-border/70 bg-muted/20 p-4 md:p-5">
              <div className="mb-4 border-b border-border/60 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Preferences</h2>
                <p className="mt-1 text-xs text-muted-foreground">Regional, communication, and notification behavior.</p>
              </div>
              <div className="space-y-5">
                <Card id="settings-region-pay" className="mobile-settings-card border-border/80 shadow-sm">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center gap-2">
                      <Globe2 className="text-primary size-4" />
                      <CardTitle className="text-lg">Region and Pay</CardTitle>
                    </div>
                    <CardDescription>Used in earnings and summary calculations.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 p-6 pt-0">
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select value={data.settings.country} onValueChange={handleCountryChange}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countryOptions.map(c => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select
                        value={data.settings.currency}
                        onValueChange={value => {
                          const selected = currencyOptions.find(c => c.code === value)
                          if (!selected) return
                          updateSettings({ currency: selected.code, currencySymbol: selected.symbol })
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencyOptions.map(c => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Auto-set when you change country — you can still override it.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Pay period</Label>
                      <Select
                        value={data.settings.payPeriod}
                        onValueChange={value => updateSettings({ payPeriod: value as typeof data.settings.payPeriod })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {payPeriodOptions.map(p => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {isSpecialUser ? (
                      <div className="space-y-2">
                        <Label>WhatsApp number</Label>
                        <Input
                          type="tel"
                          inputMode="tel"
                          placeholder="+91 7009424374"
                          value={data.settings.whatsappNumber}
                          onChange={(event) => updateSettings({ whatsappNumber: event.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Used for one-tap support and insights messages for this special account.
                        </p>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label>Daily reset time zone</Label>
                      <Select
                        value={selectedTimeZone}
                        onValueChange={(value) => updateSettings({ timeZone: value })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeZoneSelectOptions.map((zone) => (
                            <SelectItem key={zone} value={zone}>
                              {zone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Routine tasks and daily insights reset at 12:00 AM in this zone. Current time: {selectedTimeZoneNow}
                      </p>
                    </div>

                    <div className="space-y-3 rounded-lg border border-border/60 bg-card/50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">World clock</p>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Clock 1 label</Label>
                          <Input
                            value={data.settings.worldClockPrimaryLabel}
                            onChange={(event) => updateSettings({ worldClockPrimaryLabel: event.target.value })}
                            placeholder="Brisbane"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Clock 1 time zone</Label>
                          <Select
                            value={worldClockPrimaryZone}
                            onValueChange={(value) => updateSettings({ worldClockPrimaryTimeZone: value })}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {worldClockZoneOptions.map((zone) => (
                                <SelectItem key={`clock1-${zone}`} value={zone}>
                                  {zone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Clock 2 label</Label>
                          <Input
                            value={data.settings.worldClockSecondaryLabel}
                            onChange={(event) => updateSettings({ worldClockSecondaryLabel: event.target.value })}
                            placeholder="Punjab"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Clock 2 time zone</Label>
                          <Select
                            value={worldClockSecondaryZone}
                            onValueChange={(value) => updateSettings({ worldClockSecondaryTimeZone: value })}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {worldClockZoneOptions.map((zone) => (
                                <SelectItem key={`clock2-${zone}`} value={zone}>
                                  {zone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card id="settings-notifications" className="mobile-settings-card border-border/80 shadow-sm">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center gap-2">
                      <Bell className="text-primary size-4" />
                      <CardTitle className="text-lg">Notifications</CardTitle>
                    </div>
                    <CardDescription>Control alerts, categories, and quiet hours.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 p-6 pt-0">
                    <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Enable notifications</p>
                        <p className="text-xs text-muted-foreground">Master switch for app notifications.</p>
                      </div>
                      <Switch
                        checked={data.settings.notificationsEnabled}
                        onCheckedChange={(checked) => updateSettings({ notificationsEnabled: Boolean(checked) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setNotifTypesOpen(v => !v)}
                        className="flex w-full items-center justify-between rounded-lg border border-border/60 px-3 py-2.5 text-sm font-medium hover:bg-muted/40 transition-colors"
                      >
                        <span>Notification types</span>
                        {notifTypesOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                      </button>
                      {notifTypesOpen && (
                        <div className="grid grid-cols-1 gap-2">
                          {notificationTypeOptions.map((type) => {
                            const checked = data.settings.notificationTypes.includes(type.value)
                            return (
                              <label key={type.value} className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(next) => {
                                    const enabled = Boolean(next)
                                    const nextTypes = enabled
                                      ? Array.from(new Set([...data.settings.notificationTypes, type.value]))
                                      : data.settings.notificationTypes.filter(t => t !== type.value)
                                    updateSettings({ notificationTypes: nextTypes })
                                  }}
                                />
                                <span>{type.label}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Quiet hours</p>
                          <p className="text-xs text-muted-foreground">Pause notification generation during selected time.</p>
                        </div>
                        <Switch
                          checked={data.settings.quietHoursEnabled}
                          onCheckedChange={(checked) => updateSettings({ quietHoursEnabled: Boolean(checked) })}
                        />
                      </div>
                      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 transition-opacity duration-200 ${!data.settings.quietHoursEnabled ? "opacity-40 pointer-events-none select-none" : ""}`}>
                        <div className="space-y-1.5">
                          <Label htmlFor="quiet-start">Start</Label>
                          <Input
                            id="quiet-start"
                            type="time"
                            className="h-10"
                            value={data.settings.quietHoursStart}
                            onChange={e => updateSettings({ quietHoursStart: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="quiet-end">End</Label>
                          <Input
                            id="quiet-end"
                            type="time"
                            className="h-10"
                            value={data.settings.quietHoursEnd}
                            onChange={e => updateSettings({ quietHoursEnd: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card id="settings-work-limits" className="mobile-settings-card border-border/80 shadow-sm border-primary/20">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="text-primary size-4" />
                      <CardTitle className="text-lg">Work Limits & Visa Guardian</CardTitle>
                    </div>
                    <CardDescription>Monitor work hour limits for visa compliance or personal goals.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 p-6 pt-0">
                    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Enable Visa Guardian</p>
                        <p className="text-xs text-muted-foreground">Show work hour progress in the Shifts tab.</p>
                      </div>
                      <Switch
                        checked={data.settings.workHourLimits.enabled}
                        onCheckedChange={(checked) => updateSettings({
                          workHourLimits: { ...data.settings.workHourLimits, enabled: Boolean(checked) }
                        })}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="max-hours">Max hours per cycle</Label>
                        <Input
                          id="max-hours"
                          type="number"
                          className="h-10"
                          value={data.settings.workHourLimits.maxHours}
                          onChange={e => updateSettings({
                            workHourLimits: { ...data.settings.workHourLimits, maxHours: Number(e.target.value) }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cycle-days">Cycle length (days)</Label>
                        <Select
                          value={String(data.settings.workHourLimits.cycleDays)}
                          onValueChange={v => updateSettings({
                            workHourLimits: { ...data.settings.workHourLimits, cycleDays: Number(v) }
                          })}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">Weekly (7 days)</SelectItem>
                            <SelectItem value="14">Fortnightly (14 days)</SelectItem>
                            <SelectItem value="28">4 Weeks (28 days)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cycle-start">Cycle anchor date</Label>
                      <Input
                        id="cycle-start"
                        type="date"
                        className="h-10"
                        value={data.settings.workHourLimits.cycleStart}
                        onChange={e => updateSettings({
                          workHourLimits: { ...data.settings.workHourLimits, cycleStart: e.target.value }
                        })}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        This date marks the start of a new work cycle (e.g., a Monday when your fortnightly limit resets).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8 lg:col-span-4">
            <div className="mobile-settings-group rounded-xl border border-border/70 bg-muted/20 p-4 md:p-5">
              <div className="mb-4 border-b border-border/60 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Billing</h2>
                <p className="mt-1 text-xs text-muted-foreground">Plan status and renewal controls.</p>
              </div>
              <div className="space-y-5">
                <Card id="settings-subscription" className="mobile-settings-card border-border/80 shadow-sm">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center gap-2">
                      <WalletCards className="text-primary size-4" />
                      <CardTitle className="text-lg">Subscription</CardTitle>
                    </div>
                    <CardDescription>Manage your plan and renewal settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6 pt-0">
                    {loadingSubscription ? (
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Loader2 className="size-4 animate-spin" />
                        <span>Loading subscription status...</span>
                      </div>
                    ) : null}

                    {!loadingSubscription && subscriptionError ? (
                      <Alert variant="destructive">
                        <AlertTitle>Subscription status unavailable</AlertTitle>
                        <AlertDescription>{subscriptionError}</AlertDescription>
                      </Alert>
                    ) : null}

                    {!loadingSubscription && !subscriptionError && !subscription ? (
                      <div className="space-y-3">
                        <p className="text-muted-foreground text-sm">
                          No paid subscription found on this account.
                        </p>
                        <Badge variant="secondary">Current plan: {planName}</Badge>
                        <Button asChild className="w-full sm:w-fit">
                          <Link href="/pricing">View plans</Link>
                        </Button>
                      </div>
                    ) : null}

                    {!loadingSubscription && subscription ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{subscription.planName}</Badge>
                          <Badge variant={subscription.status === "active" || isLifetimePlan ? "secondary" : "outline"}>
                            {subscription.status}
                          </Badge>
                          {isLifetimePlan ? (
                            <Badge variant="secondary">Lifetime access</Badge>
                          ) : subscription.cancelAtPeriodEnd ? (
                            <Badge variant="outline">Cancels at period end</Badge>
                          ) : (
                            <Badge variant="secondary">Auto-renew on</Badge>
                          )}
                        </div>
                        <div className="space-y-1.5 text-sm">
                          <p>
                            <span className="text-muted-foreground">{isLifetimePlan ? "Renewal:" : "Next billing date:"}</span>{" "}
                            {isLifetimePlan ? "No renewal required." : new Date(subscription.paypalCurrentPeriodEnd).toLocaleDateString()}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Last updated:</span>{" "}
                            {new Date(subscription.updatedAt).toLocaleString()}
                          </p>
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="text-muted-foreground">Subscription ID:</span>
                            <code className="max-w-full break-all whitespace-normal rounded bg-muted px-2 py-0.5 text-xs">{subscription.paypalSubscriptionId}</code>
                            <Button size="sm" variant="outline" onClick={copySubscriptionId} className="h-7 gap-1.5 px-2">
                              <Copy className="size-3.5" />
                              Copy
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            onClick={() => void loadSubscriptionStatus()}
                            disabled={loadingSubscription || Boolean(managingSubscription)}
                            className="gap-2"
                          >
                            <RefreshCw className="size-4" />
                            Refresh
                          </Button>
                          {!isLifetimePlan && subscription.cancelAtPeriodEnd ? (
                            <Button
                              onClick={() => void manageSubscription("reactivate")}
                              disabled={Boolean(managingSubscription)}
                              className="gap-2"
                            >
                              {managingSubscription === "reactivate" ? <Loader2 className="size-4 animate-spin" /> : null}
                              Re-enable Auto Renew
                            </Button>
                          ) : null}
                          {!isLifetimePlan && !subscription.cancelAtPeriodEnd ? (
                            <Button
                              variant="destructive"
                              onClick={() => void manageSubscription("cancel")}
                              disabled={Boolean(managingSubscription)}
                              className="gap-2"
                            >
                              {managingSubscription === "cancel" ? <Loader2 className="size-4 animate-spin" /> : null}
                              Cancel at Period End
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mobile-settings-group rounded-xl border border-border/70 bg-muted/20 p-4 md:p-5">
              <div className="mb-4 border-b border-border/60 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Personalization</h2>
                <p className="mt-1 text-xs text-muted-foreground">Customize your dashboard layout.</p>
              </div>
              <div className="space-y-5">
                <Card id="settings-widgets" className="mobile-settings-card border-border/80 shadow-sm">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="text-primary size-4" />
                      <CardTitle className="text-lg">Dashboard Widgets</CardTitle>
                    </div>
                    <CardDescription>Choose what appears on your home dashboard.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <button
                      type="button"
                      onClick={() => setWidgetsOpen(v => !v)}
                      className="flex w-full items-center justify-between rounded-lg border border-border/60 px-3 py-2.5 text-sm font-medium hover:bg-muted/40 transition-colors"
                    >
                      <span>Dashboard widgets</span>
                      {widgetsOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                    </button>
                    {widgetsOpen && (
                      <div className="space-y-2">
                        {dashboardWidgetOptions.map((widget) => (
                          <label key={widget.key} className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm">
                            <Checkbox
                              checked={data.settings.dashboardWidgets[widget.key]}
                              onCheckedChange={(next) =>
                                updateSettings({
                                  dashboardWidgets: {
                                    ...data.settings.dashboardWidgets,
                                    [widget.key]: Boolean(next),
                                  },
                                })
                              }
                            />
                            <span>{widget.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {isSpecialUser ? (
                  <Card id="settings-companion" className="mobile-settings-card border-rose-300/40 bg-gradient-to-br from-rose-500/10 to-orange-500/10 shadow-sm">
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-center gap-2">
                        <Heart className="size-4 text-rose-500" />
                        <CardTitle className="text-lg">{displayName}&apos;s Companion Settings</CardTitle>
                      </div>
                      <CardDescription>Private controls for reminders and puppy vibes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 p-6 pt-0">
                      <div className="space-y-2">
                        <Label htmlFor="companion-nickname">Display name</Label>
                        <Input
                          id="companion-nickname"
                          value={data.settings.specialCompanion.nickname}
                          onChange={(event) => updateSpecialCompanion({ nickname: event.target.value })}
                          placeholder="Wifey"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companion-water-goal">Daily water bottle goal</Label>
                        <Select
                          value={String(companionWaterGoal)}
                          onValueChange={(value) => {
                            const parsed = Number(value)
                            const nextGoal = Number.isFinite(parsed) ? Math.max(4, Math.min(12, Math.round(parsed))) : 8
                            updateSpecialCompanion({ waterBottleGoal: nextGoal })
                            triggerSpecialCelebration(`Water goal set to ${nextGoal}`)
                          }}
                        >
                          <SelectTrigger id="companion-water-goal">
                            <SelectValue placeholder="Select target" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4">4 bottles</SelectItem>
                            <SelectItem value="5">5 bottles</SelectItem>
                            <SelectItem value="6">6 bottles</SelectItem>
                            <SelectItem value="7">7 bottles</SelectItem>
                            <SelectItem value="8">8 bottles</SelectItem>
                            <SelectItem value="9">9 bottles</SelectItem>
                            <SelectItem value="10">10 bottles</SelectItem>
                            <SelectItem value="11">11 bottles</SelectItem>
                            <SelectItem value="12">12 bottles</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Special reminders</p>
                          <p className="text-xs text-muted-foreground">Water, exercise, and study prompts.</p>
                        </div>
                        <Switch
                          checked={data.settings.specialCompanion.remindersEnabled}
                          onCheckedChange={(checked) => {
                            updateSpecialCompanion({ remindersEnabled: Boolean(checked) })
                            triggerSpecialCelebration("Reminder preferences updated")
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Celebration effects</p>
                          <p className="text-xs text-muted-foreground">Show hearts and puppy sparkles on special actions.</p>
                        </div>
                        <Switch
                          checked={data.settings.specialCompanion.celebrationEnabled}
                          onCheckedChange={(checked) => {
                            updateSpecialCompanion({ celebrationEnabled: Boolean(checked) })
                            triggerSpecialCelebration("Celebration effects updated")
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Puppy touch</p>
                          <p className="text-xs text-muted-foreground">Keep puppy accents in companion sections.</p>
                        </div>
                        <Switch
                          checked={data.settings.specialCompanion.lovesPuppies}
                          onCheckedChange={(checked) => {
                            updateSpecialCompanion({ lovesPuppies: Boolean(checked) })
                            triggerSpecialCelebration("Puppy mode updated")
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-2 rounded-md border border-dashed border-rose-300/50 bg-rose-500/5 px-3 py-2 text-xs text-muted-foreground">
                        <Shield className="size-3.5 text-rose-500" />
                        <PawPrint className="size-3.5 text-rose-500" />
                        Companion mode is active only on this account.
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mobile-settings-group rounded-xl border border-border/70 bg-muted/20 p-4 md:p-5">
            <div className="mb-4 border-b border-border/60 pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">System</h2>
              <p className="mt-1 text-xs text-muted-foreground">App info, maintenance, and destructive actions.</p>
            </div>
            <div className="space-y-5">
              <Card className="mobile-settings-card hidden border-border/80 shadow-sm md:block">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center gap-2">
                    <Info className="text-primary size-4" />
                    <CardTitle className="text-lg">About ShiftWise</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6 pt-0 text-sm">
                  <p className="text-muted-foreground leading-relaxed">
                    ShiftWise helps you track shifts, earnings, expenses, and goals with support for Australian penalty rates and more.
                  </p>
                  <Separator />
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <WalletCards className="size-3.5" />
                    <span>Version 1.0.0</span>
                    <CalendarClock className="ml-2 size-3.5" />
                    <span>2026</span>
                  </div>
                </CardContent>
              </Card>

              <Card id="settings-data-reset" className="mobile-settings-card border-destructive/40 shadow-sm">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center gap-2">
                    <Database className="text-destructive size-4" />
                    <CardTitle className="text-lg">Data Reset</CardTitle>
                  </div>
                  <CardDescription>Clear all local app data from this browser.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 p-6 pt-0">
                  <Button variant="destructive" onClick={handleReset} disabled={resetting} className="w-full sm:w-fit">
                    {resetting ? "Resetting..." : "Reset All Data"}
                  </Button>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    This removes jobs, shifts, expenses, goals, and settings. This action cannot be undone.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </AppShell >
  )
}
