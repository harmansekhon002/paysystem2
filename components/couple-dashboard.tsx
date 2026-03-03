"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, PiggyBank, Sparkles, Trophy } from "lucide-react"
import { useAppData } from "@/components/data-provider"
import { triggerSpecialCelebration } from "@/lib/special-features"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/store"

type CoupleFund = {
  target: number
  current: number
}

const DEFAULT_FUND: CoupleFund = {
  target: 500,
  current: 0,
}

export function CoupleDashboard() {
  const { data, isSpecialUser, displayName } = useAppData()
  const loveModeActive = isSpecialUser && data.settings.specialCompanion.loveThemeEnabled
  const router = useRouter()
  const [fund, setFund] = useState<CoupleFund>(DEFAULT_FUND)
  const [addAmount, setAddAmount] = useState("50")

  useEffect(() => {
    if (isSpecialUser && !loveModeActive) {
      router.replace("/")
    }
  }, [isSpecialUser, loveModeActive, router])

  useEffect(() => {
    if (typeof window === "undefined" || !loveModeActive) return
    try {
      const raw = localStorage.getItem("shiftwise:couple-fund")
      if (!raw) return
      const parsed = JSON.parse(raw) as CoupleFund
      setFund(parsed)
    } catch {
      // Ignore malformed fund data.
    }
  }, [loveModeActive])

  const saveFund = (next: CoupleFund) => {
    setFund(next)
    try {
      localStorage.setItem("shiftwise:couple-fund", JSON.stringify(next))
    } catch {
      // Ignore local storage failures.
    }
  }

  const totalEarnings = useMemo(() => data.shifts.reduce((sum, shift) => sum + shift.earnings, 0), [data.shifts])
  const totalSavedGoals = useMemo(() => data.goals.reduce((sum, goal) => sum + goal.currentAmount, 0), [data.goals])

  const addToFund = () => {
    const value = Number(addAmount)
    if (!Number.isFinite(value) || value <= 0) return

    const next = {
      ...fund,
      current: Math.min(fund.target, Math.round((fund.current + value) * 100) / 100),
    }
    saveFund(next)
    triggerSpecialCelebration("Couple fund updated")
  }

  if (!isSpecialUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Private couple dashboard</CardTitle>
          <CardDescription>This page is only available on the companion account.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!loveModeActive) return null

  const progress = fund.target > 0 ? Math.min(100, Math.round((fund.current / fund.target) * 100)) : 0

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-accent/35">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Heart className="size-6 text-primary" />
                Couple Dashboard
              </CardTitle>
              <CardDescription>Shared progress for {displayName} and Harman.</CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1">Together mode</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-amber-500" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalEarnings, data.settings.currencySymbol)}</p>
            <p className="text-xs text-muted-foreground">All shifts logged in this account</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-emerald-500" />
              Goal Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSavedGoals, data.settings.currencySymbol)}</p>
            <p className="text-xs text-muted-foreground">Combined across all goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PiggyBank className="size-4 text-indigo-500" />
              Date Night Fund
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(fund.current, data.settings.currencySymbol)}</p>
            <p className="text-xs text-muted-foreground">
              Target {formatCurrency(fund.target, data.settings.currencySymbol)} · {progress}% complete
            </p>
            <div className="flex gap-2">
              <Input
                value={addAmount}
                onChange={(event) => setAddAmount(event.target.value)}
                inputMode="decimal"
                placeholder="Add amount"
              />
              <Button onClick={addToFund}>Add</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
