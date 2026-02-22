"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, TrendingUp, TrendingDown, CheckCircle2, Target, Bell, BellOff } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { useAppData } from "@/components/data-provider"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/store"
import { trackEvent } from "@/lib/analytics"
import { requestNotificationPermission, checkGoalMilestones } from "@/lib/notifications"

function getGoalStatus(goal: { currentAmount: number; targetAmount: number; deadline: string }) {
  const percent = (goal.currentAmount / goal.targetAmount) * 100
  if (percent >= 100) return { label: "Achieved!", variant: "default" as const, icon: CheckCircle2 }

  const deadline = new Date(goal.deadline + "T00:00:00")
  const now = new Date()
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86400000)
  if (daysLeft < 0) return { label: "Overdue", variant: "destructive" as const, icon: TrendingDown }

  // Simple on-track heuristic
  const totalDays = Math.ceil((deadline.getTime() - new Date("2026-01-01").getTime()) / 86400000)
  const elapsed = totalDays - daysLeft
  const expectedPercent = totalDays > 0 ? (elapsed / totalDays) * 100 : 0
  if (percent >= expectedPercent * 0.8) return { label: "On track", variant: "default" as const, icon: TrendingUp }
  return { label: "Behind", variant: "secondary" as const, icon: TrendingDown }
}

export function Goals() {
  const { data, addGoal, updateGoal, removeGoal } = useAppData()
  const { toast } = useToast()
  const currencySymbol = data.settings.currencySymbol
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addingFunds, setAddingFunds] = useState<string | null>(null)
  const [fundAmount, setFundAmount] = useState("")
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  const fundValue = parseFloat(fundAmount)
  const fundValid = !Number.isNaN(fundValue) && fundValue > 0
  const defaultDeadline = (() => {
    const date = new Date()
    date.setMonth(date.getMonth() + 3)
    return date.toISOString().split("T")[0]
  })()

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted")
    }
  }, [])

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission()
    setNotificationsEnabled(granted)
    if (granted) {
      toast({ title: "Notifications enabled", description: "You'll be notified of goal milestones!" })
      trackEvent("notifications_enabled")
    } else {
      toast({ title: "Notifications blocked", description: "Check your browser settings to enable.", variant: "destructive" })
    }
  }

  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadline: defaultDeadline,
  })
  const targetValue = parseFloat(form.targetAmount)
  const goalValid = form.name.trim().length > 0 && !Number.isNaN(targetValue) && targetValue > 0

  const totalSaved = data.goals.reduce((s, g) => s + g.currentAmount, 0)
  const totalTarget = data.goals.reduce((s, g) => s + g.targetAmount, 0)
  const overallPercent = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  const handleAddGoal = () => {
    if (form.name && form.targetAmount) {
      const targetAmount = parseFloat(form.targetAmount)
      addGoal({
        name: form.name,
        targetAmount,
        currentAmount: parseFloat(form.currentAmount) || 0,
        deadline: form.deadline,
        icon: "Target",
      })
      trackEvent("goal_added", { name: form.name, targetAmount })
      toast({ title: "Goal created", description: form.name })
      setForm({ name: "", targetAmount: "", currentAmount: "", deadline: defaultDeadline })
      setDialogOpen(false)
    }
  }

  const handleAddFunds = (goalId: string) => {
    const amount = parseFloat(fundAmount)
    if (!isNaN(amount) && amount > 0) {
      const goal = data.goals.find(g => g.id === goalId)
      if (goal) {
        const previousAmount = goal.currentAmount
        const newAmount = goal.currentAmount + amount
        updateGoal(goalId, { currentAmount: newAmount })

        // Check for milestone notifications
        if (notificationsEnabled) {
          checkGoalMilestones(goal.name, newAmount, goal.targetAmount, previousAmount)
        }

        trackEvent("goal_funded", { amount })
        toast({ title: "Funds added", description: `${formatCurrency(amount, currencySymbol)} to ${goal.name}` })
      }
    }
    setAddingFunds(null)
    setFundAmount("")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Goals</h1>
          <p className="mt-1 text-sm text-muted-foreground">Save towards what matters.</p>
        </div>
        <div className="flex gap-2">
          {typeof window !== "undefined" && "Notification" in window && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handleEnableNotifications}
              disabled={notificationsEnabled}
            >
              {notificationsEnabled ? <Bell className="size-4" /> : <BellOff className="size-4" />}
              <span className="hidden sm:inline">{notificationsEnabled ? "Alerts On" : "Enable Alerts"}</span>
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="size-4" /><span className="hidden sm:inline">New Goal</span></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Savings Goal</DialogTitle></DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Goal Name</Label>
                  <Input placeholder="e.g. Bali Trip" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="goal-target" className="text-xs">Target Amount ({data.settings.currency})</Label>
                    <Input id="goal-target" type="number" min={0} step="0.01" placeholder="1000" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="goal-saved" className="text-xs">Already Saved</Label>
                    <Input id="goal-saved" type="number" min={0} step="0.01" placeholder="0" value={form.currentAmount} onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Deadline</Label>
                  <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleAddGoal} disabled={!goalValid}>Create Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Total Saved</span>
            <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrency(totalSaved, currencySymbol)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Total Target</span>
            <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrency(totalTarget, currencySymbol)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Overall</span>
            <p className="mt-1 text-xl font-semibold text-foreground">{overallPercent}%</p>
            <Progress value={overallPercent} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Goal cards */}
      {data.goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="mx-auto size-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No goals yet. Create one to start saving.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {data.goals.map(goal => {
            const percent = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
            const status = getGoalStatus(goal)
            const StatusIcon = status.icon
            const deadline = new Date(goal.deadline + "T00:00:00")
            const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86400000)

            return (
              <Card key={goal.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                        <Target className="size-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-foreground">{goal.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? "Due today" : "Past deadline"}
                          {" "}&middot; Due {deadline.toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant} className="gap-1 text-xs">
                        <StatusIcon className="size-3" />{status.label}
                      </Badge>
                      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => {
                        removeGoal(goal.id)
                        trackEvent("goal_removed")
                        toast({ title: "Goal removed" })
                      }}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <span className="text-2xl font-semibold text-foreground">{formatCurrency(goal.currentAmount, currencySymbol)}</span>
                      <span className="text-sm text-muted-foreground"> / {formatCurrency(goal.targetAmount, currencySymbol)}</span>
                    </div>
                    <span className="text-sm font-medium text-primary">{percent}%</span>
                  </div>
                  <Progress value={percent} className="h-2.5 mb-3" />

                  {addingFunds === goal.id ? (
                    <div className="flex items-center gap-2">
                      <Input type="number" min={0} step="0.01" placeholder="Amount" className="h-8" value={fundAmount} onChange={e => setFundAmount(e.target.value)} autoFocus />
                      <Button size="sm" onClick={() => handleAddFunds(goal.id)} disabled={!fundValid}>Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setAddingFunds(null); setFundAmount("") }}>Cancel</Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="w-fit" onClick={() => setAddingFunds(goal.id)}>
                      <Plus className="mr-1 size-3.5" />Add Funds
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
