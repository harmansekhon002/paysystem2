"use client"

import { useEffect, useState } from "react"
import { Bell, CalendarClock, Copy, Database, Globe2, Heart, Info, LayoutDashboard, Loader2, Palette, PawPrint, RefreshCw, Shield, UserRound, WalletCards } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

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

type SubscriptionStatus = {
  paypalSubscriptionId: string
  paypalPlanId: string
  paypalCurrentPeriodEnd: string
  status: string
  cancelAtPeriodEnd: boolean
  updatedAt: string
  planName: string
}

export default function SettingsPage() {
  const { data, updateSettings, planName, updateSpecialCompanion, isSpecialUser, displayName } = useAppData()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [resetting, setResetting] = useState(false)
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [managingSubscription, setManagingSubscription] = useState<"cancel" | "reactivate" | null>(null)
  const [specialPin, setSpecialPin] = useState(data.settings.specialCompanion.pinCode)
  const [profile, setProfile] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("shiftwise:profile")
      if (stored) return JSON.parse(stored)
    }
    return { name: "", email: "" }
  })

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

  function handleProfileSave() {
    localStorage.setItem("shiftwise:profile", JSON.stringify(profile))
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

  function handleThemeSelect(value: string) {
    setTheme(value)
    if (isSpecialUser && data.settings.specialCompanion.loveThemeEnabled) {
      updateSpecialCompanion({ loveThemeEnabled: false })
    }
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
    { value: "Australia", label: "Australia" },
    { value: "USA", label: "USA" },
    { value: "UK", label: "UK" },
    { value: "Other", label: "Other" },
  ]
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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-10">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/8 via-card to-card shadow-sm">
          <CardHeader className="space-y-4 p-7 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Account & App Settings
              </Badge>
            </div>
            <CardDescription className="text-sm md:text-base">
              Manage your profile, region, pay cycle, and app appearance in one place.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-8 lg:col-span-8">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 md:p-5">
              <div className="mb-4 border-b border-border/60 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Account</h2>
                <p className="mt-1 text-xs text-muted-foreground">Identity and billing details.</p>
              </div>
              <div className="space-y-5">
                <Card id="settings-profile" className="border-border/80 shadow-sm">
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
                    <Button onClick={handleProfileSave} className="w-full sm:w-fit">
                      Save Profile
                    </Button>
                  </CardContent>
                </Card>

                <Card id="settings-subscription" className="border-border/80 shadow-sm">
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
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-muted-foreground">Subscription ID:</span>
                            <code className="rounded bg-muted px-2 py-0.5 text-xs">{subscription.paypalSubscriptionId}</code>
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
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 md:p-5">
              <div className="mb-4 border-b border-border/60 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Preferences</h2>
                <p className="mt-1 text-xs text-muted-foreground">How the app communicates and calculates values.</p>
              </div>
              <div className="space-y-5">
                <Card id="settings-notifications" className="border-border/80 shadow-sm">
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
                      <Label>Notification types</Label>
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
                      <div className="grid grid-cols-2 gap-3">
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

                <Card id="settings-region-pay" className="border-border/80 shadow-sm">
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
                      <Select value={data.settings.country} onValueChange={v => updateSettings({ country: v })}>
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
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8 lg:col-span-4">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 md:p-5">
              <div className="mb-4 border-b border-border/60 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Personalization</h2>
                <p className="mt-1 text-xs text-muted-foreground">Customize visual layout and theme.</p>
              </div>
              <div className="space-y-5">
                <Card id="settings-widgets" className="border-border/80 shadow-sm">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="text-primary size-4" />
                      <CardTitle className="text-lg">Dashboard Widgets</CardTitle>
                    </div>
                    <CardDescription>Choose what appears on your home dashboard.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 p-6 pt-0">
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
                  </CardContent>
                </Card>

                <Card id="settings-appearance" className="border-border/80 shadow-sm">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center gap-2">
                      <Palette className="text-primary size-4" />
                      <CardTitle className="text-lg">Appearance</CardTitle>
                    </div>
                    <CardDescription>Choose how ShiftWise looks for you.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 p-6 pt-0">
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <div className="flex items-center gap-2">
                        <Select value={theme} onValueChange={handleThemeSelect}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">System</SelectItem>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {isSpecialUser ? (
                  <Card id="settings-companion" className="border-rose-300/40 bg-gradient-to-br from-rose-500/10 to-orange-500/10 shadow-sm">
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-center gap-2">
                        <Heart className="size-4 text-rose-500" />
                        <CardTitle className="text-lg">{displayName}&apos;s Companion Settings</CardTitle>
                      </div>
                      <CardDescription>Private controls for pin unlock, privacy mode, reminders, and puppy vibes.</CardDescription>
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
                        <Label htmlFor="companion-pin">Quick unlock pin (4-8 digits)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="companion-pin"
                            inputMode="numeric"
                            type="password"
                            placeholder="Enter pin"
                            value={specialPin}
                            onChange={(event) => setSpecialPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                          />
                          <Button type="button" onClick={handleSaveSpecialPin} className="shrink-0">
                            Save
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 rounded-lg border border-border/60 bg-card/60 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">Enable quick pin lock</p>
                            <p className="text-xs text-muted-foreground">Use pin unlock after initial login session.</p>
                          </div>
                          <Switch
                            checked={data.settings.specialCompanion.pinEnabled}
                            onCheckedChange={(checked) => {
                              if (checked && data.settings.specialCompanion.pinCode.trim().length < 4) {
                                toast({
                                  title: "Pin required",
                                  description: "Save a 4-8 digit pin first.",
                                  variant: "destructive",
                                })
                                return
                              }
                              updateSpecialCompanion({ pinEnabled: Boolean(checked) })
                              triggerSpecialCelebration("Pin lock preference updated")
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">Privacy mode</p>
                            <p className="text-xs text-muted-foreground">Blur dashboard content until manually revealed.</p>
                          </div>
                          <Switch
                            checked={data.settings.specialCompanion.privacyMode}
                            onCheckedChange={(checked) => {
                              updateSpecialCompanion({ privacyMode: Boolean(checked) })
                              triggerSpecialCelebration("Privacy mode updated")
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">Special reminders</p>
                            <p className="text-xs text-muted-foreground">Water, exercise, paath, and study prompts from Harman.</p>
                          </div>
                          <Switch
                            checked={data.settings.specialCompanion.remindersEnabled}
                            onCheckedChange={(checked) => {
                              updateSpecialCompanion({ remindersEnabled: Boolean(checked) })
                              triggerSpecialCelebration("Reminder preferences updated")
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
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

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 md:p-5">
              <div className="mb-4 border-b border-border/60 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">System</h2>
                <p className="mt-1 text-xs text-muted-foreground">App info, maintenance, and destructive actions.</p>
              </div>
              <div className="space-y-5">
                <Card className="border-border/80 shadow-sm">
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

                <Card id="settings-data-reset" className="border-destructive/40 shadow-sm">
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
      </div>
    </AppShell>
  )
}
