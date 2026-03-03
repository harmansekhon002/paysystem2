"use client"

import { useState } from "react"
import { CalendarClock, Database, Globe2, Info, Palette, UserRound, WalletCards } from "lucide-react"
import { useTheme } from "next-themes"

import { AppShell } from "@/components/app-shell"
import { useAppData } from "@/components/data-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const { data, updateSettings } = useAppData()
  const { theme, setTheme } = useTheme()
  const [resetting, setResetting] = useState(false)
  const [profile, setProfile] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("shiftwise:profile")
      if (stored) return JSON.parse(stored)
    }
    return { name: "", email: "" }
  })

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

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-10">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/8 via-card to-card shadow-sm">
          <CardHeader className="space-y-4 p-7 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-3xl font-extrabold tracking-tight">Settings</CardTitle>
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
          <div className="flex flex-col gap-8 lg:col-span-7">
            <Card className="border-border/80 shadow-sm">
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

            <Card className="border-border/80 shadow-sm">
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

          <div className="flex flex-col gap-8 lg:col-span-5">
            <Card className="border-border/80 shadow-sm">
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
                  <Select value={theme} onValueChange={setTheme}>
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
              </CardContent>
            </Card>

            <Card className="border-destructive/40 shadow-sm">
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
          </div>
        </div>
      </div>
    </AppShell>
  )
}
