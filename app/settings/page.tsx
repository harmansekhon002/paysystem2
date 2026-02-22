"use client"

import { AppShell } from "@/components/app-shell"
import { useAppData } from "@/components/data-provider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { useState } from "react"


export default function SettingsPage() {
  const { data, updateSettings } = useAppData()
  const { theme, setTheme } = useTheme()
  const [resetting, setResetting] = useState(false)
  // Demo profile state (local only)
  const [profile, setProfile] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('shiftwise:profile')
      if (stored) return JSON.parse(stored)
    }
    return { name: '', email: '' }
  })
  function handleProfileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setProfile((p: { name: string; email: string }) => ({ ...p, [name]: value }))
  }
  function handleProfileSave() {
    localStorage.setItem('shiftwise:profile', JSON.stringify(profile))
  }
  const currencyOptions = [
    { code: "AUD", symbol: "$" },
    { code: "USD", symbol: "$" },
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

  function handleReset() {
    setResetting(true)
    setTimeout(() => {
      localStorage.clear()
      window.location.reload()
    }, 800)
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto flex flex-col gap-10 py-8 px-2 md:px-0">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">Settings</h1>

        {/* Profile Section */}
        {/* Profile Section */}
        <section>
          <h2 className="text-lg font-semibold mb-2 text-primary">Profile</h2>
          <Card className="shadow-sm border-muted-foreground/10">
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>Local only, not synced.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs" htmlFor="profile-name">Name</Label>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  className="input border rounded px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary outline-none"
                  value={profile.name}
                  onChange={handleProfileChange}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs" htmlFor="profile-email">Email</Label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  className="input border rounded px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary outline-none"
                  value={profile.email}
                  onChange={handleProfileChange}
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>
              <Button variant="default" className="w-fit mt-2" onClick={handleProfileSave}>Save Profile</Button>
            </CardContent>
          </Card>
        </section>

        {/* Preferences Section */}
        <section>
          <h2 className="text-lg font-semibold mb-2 text-primary">Preferences</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* General Settings */}
            <Card className="shadow-sm border-muted-foreground/10">
              <CardHeader>
                <CardTitle className="text-base">General</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Country</Label>
                  <Select
                    value={data.settings.country}
                    onValueChange={v => updateSettings({ country: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {countryOptions.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Currency</Label>
                  <Select
                    value={data.settings.currency}
                    onValueChange={(value) => {
                      const selected = currencyOptions.find((c) => c.code === value)
                      if (!selected) return
                      updateSettings({ currency: selected.code, currencySymbol: selected.symbol })
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Pay Period</Label>
                  <Select
                    value={data.settings.payPeriod}
                    onValueChange={(value) => updateSettings({ payPeriod: value as typeof data.settings.payPeriod })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {payPeriodOptions.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card className="shadow-sm border-muted-foreground/10">
              <CardHeader>
                <CardTitle className="text-base">Appearance</CardTitle>
                <CardDescription>Customize the look and feel.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Data & Reset Section */}
        <section>
          <h2 className="text-lg font-semibold mb-2 text-primary">Data & Reset</h2>
          <Card className="shadow-sm border-muted-foreground/10">
            <CardHeader>
              <CardTitle className="text-base">Manage Data</CardTitle>
              <CardDescription>Reset your account and clear all data.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button variant="destructive" onClick={handleReset} disabled={resetting} className="w-fit">
                {resetting ? "Resetting..." : "Reset All Data"}
              </Button>
              <span className="text-xs text-muted-foreground">This will clear all your jobs, shifts, expenses, goals, and settings. This action cannot be undone.</span>
            </CardContent>
          </Card>
        </section>

        {/* About Section */}
        <section>
          <h2 className="text-lg font-semibold mb-2 text-primary">About</h2>
          <Card className="shadow-sm border-muted-foreground/10">
            <CardHeader>
              <CardTitle className="text-base">About ShiftWise</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <span className="text-sm">ShiftWise helps you track your shifts, earnings, expenses, and goals with full support for Australian penalty rates and more.</span>
              <span className="text-xs text-muted-foreground">Version 1.0.0 &copy; 2026</span>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  )
}
