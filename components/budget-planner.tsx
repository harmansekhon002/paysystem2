"use client"

import { useState, useMemo } from "react"
import { Plus, Trash2, TrendingDown, TrendingUp, Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { useAppData } from "@/components/data-provider"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/store"
import { trackEvent } from "@/lib/analytics"
import { ResponsiveContainer, Tooltip } from "recharts"
import { PieChart } from "@/components/ui/pie-chart"

const CATEGORY_COLORS = ["#0d9488", "#f59e0b", "#ec4899", "#6366f1", "#8b5cf6", "#06b6d4", "#84cc16", "#ef4444"]

export function BudgetPlanner() {
  const { data, addExpense, removeExpense, addBudgetCategory, removeBudgetCategory } = useAppData()
  const { toast } = useToast()
  const currencySymbol = data.settings.currencySymbol
  const [expenseDialog, setExpenseDialog] = useState(false)
  const [catDialog, setCatDialog] = useState(false)
  const todayStr = new Date().toISOString().split("T")[0]

  const [newExpense, setNewExpense] = useState({
    category: data.budgetCategories[0]?.name || "",
    amount: "",
    description: "",
    date: todayStr,
  })
  const expenseAmount = parseFloat(newExpense.amount)
  const expenseValid = Boolean(newExpense.category) && !Number.isNaN(expenseAmount) && expenseAmount > 0

  const [newCat, setNewCat] = useState({ name: "", budgeted: "" })
  const categoryBudget = parseFloat(newCat.budgeted)
  const categoryValid = newCat.name.trim().length > 0 && !Number.isNaN(categoryBudget) && categoryBudget > 0

  // Stats
  const stats = useMemo(() => {
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
    const monthExpenses = data.expenses.filter(e => e.date >= monthStart)
    const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)
    const totalBudgeted = data.budgetCategories.reduce((s, c) => s + c.budgeted, 0)
    const remaining = totalBudgeted - totalSpent
    const percentUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

    // Per-category spending
    const byCat = data.budgetCategories.map((cat, i) => {
      const catExpenses = monthExpenses.filter(e => e.category === cat.name)
      const spent = catExpenses.reduce((s, e) => s + e.amount, 0)
      return {
        ...cat,
        spent,
        remaining: cat.budgeted - spent,
        percent: cat.budgeted > 0 ? (spent / cat.budgeted) * 100 : 0,
        color: cat.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }
    })

    const pieData = byCat.filter(c => c.spent > 0).map(c => ({
      name: c.name,
      value: Math.round(c.spent * 100) / 100,
      color: c.color,
    }))

    return { totalSpent, totalBudgeted, remaining, percentUsed, byCat, pieData, monthExpenses }
  }, [data.expenses, data.budgetCategories])

  const handleAddExpense = () => {
    if (newExpense.amount && newExpense.category) {
      const amount = parseFloat(newExpense.amount)
      addExpense({
        category: newExpense.category,
        amount,
        description: newExpense.description,
        date: newExpense.date,
      })
      trackEvent("expense_added", { category: newExpense.category, amount })
      toast({ title: "Expense added", description: `${formatCurrency(amount, currencySymbol)} to ${newExpense.category}` })
      setNewExpense(e => ({ ...e, amount: "", description: "" }))
      setExpenseDialog(false)
    }
  }

  const handleAddCategory = () => {
    if (newCat.name && newCat.budgeted) {
      const budgeted = parseFloat(newCat.budgeted)
      addBudgetCategory({
        name: newCat.name,
        budgeted,
        color: CATEGORY_COLORS[data.budgetCategories.length % CATEGORY_COLORS.length],
      })
      trackEvent("budget_category_added", { name: newCat.name, budgeted })
      toast({ title: "Category added", description: newCat.name })
      setNewCat({ name: "", budgeted: "" })
      setCatDialog(false)
    }
  }

  const sortedExpenses = useMemo(() =>
    [...stats.monthExpenses].sort((a, b) => b.date.localeCompare(a.date)),
    [stats.monthExpenses]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Budget</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track spending against your own categories.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={catDialog} onOpenChange={setCatDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Pencil className="size-3.5" />
                <span className="hidden sm:inline">Category</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Budget Category</DialogTitle></DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Category Name</Label>
                  <Input placeholder="e.g. Subscriptions" value={newCat.name} onChange={e => setNewCat(c => ({ ...c, name: e.target.value }))} autoFocus />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Monthly Budget ({data.settings.currency})</Label>
                  <Input type="number" placeholder="100" value={newCat.budgeted} onChange={e => setNewCat(c => ({ ...c, budgeted: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleAddCategory} disabled={!categoryValid}>Add Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Expense</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Category</Label>
                  {data.budgetCategories.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                      Add a category first to log expenses.
                    </div>
                  ) : (
                    <Select value={newExpense.category} onValueChange={v => setNewExpense(e => ({ ...e, category: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {data.budgetCategories.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="expense-amount" className="text-xs">Amount ({data.settings.currency})</Label>
                  <Input id="expense-amount" type="number" min={0} step="0.01" placeholder="0.00" value={newExpense.amount} onChange={e => setNewExpense(ex => ({ ...ex, amount: e.target.value }))} autoFocus />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="expense-desc" className="text-xs">Description</Label>
                  <Input id="expense-desc" placeholder="What was this for?" value={newExpense.description} onChange={e => setNewExpense(ex => ({ ...ex, description: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="expense-date" className="text-xs">Date</Label>
                  <Input id="expense-date" type="date" value={newExpense.date} onChange={e => setNewExpense(ex => ({ ...ex, date: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleAddExpense} disabled={!expenseValid}>Add Expense</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Budget overview bar */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs text-muted-foreground">Monthly Budget</span>
              <p className="text-sm text-foreground">
                {formatCurrency(stats.totalSpent, currencySymbol)} of {formatCurrency(stats.totalBudgeted, currencySymbol)} spent
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {stats.remaining >= 0 ? <TrendingUp className="size-3.5 text-primary" /> : <TrendingDown className="size-3.5 text-destructive" />}
              <span className={`text-sm font-medium ${stats.remaining >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatCurrency(Math.abs(stats.remaining), currencySymbol)} {stats.remaining >= 0 ? "left" : "over"}
              </span>
            </div>
          </div>
          <Progress
            value={Math.min(stats.percentUsed, 100)}
            className={`h-2.5 ${stats.percentUsed > 90 ? "[&>[data-slot=progress-indicator]]:bg-destructive" : ""}`}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Category breakdown pie */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            {stats.pieData.length > 0 ? (
              <>
                <PieChart
                  data={stats.pieData}
                  tooltipFormatter={(value, name) => [formatCurrency(value, currencySymbol), "Spent"]}
                />
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {stats.pieData.map(e => (
                    <div key={e.name} className="flex items-center gap-1.5 text-xs" style={{ color: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#888' : '#222' }}>
                      <div className="size-2 rounded-full" style={{ background: e.color }} />
                      {e.name}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-6 text-sm text-muted-foreground">No expenses yet</p>
            )}
          </CardContent>
        </Card>

        {/* Per-category progress bars */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {data.budgetCategories.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No categories yet. Add one to start budgeting.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {stats.byCat.map(cat => (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full" style={{ background: cat.color }} />
                        <span className="text-sm font-medium text-foreground">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(cat.spent, currencySymbol)} / {formatCurrency(cat.budgeted, currencySymbol)}
                        </span>
                        <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive" onClick={() => {
                          removeBudgetCategory(cat.id)
                          trackEvent("budget_category_removed")
                          toast({ title: "Category removed" })
                        }}>
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(cat.percent, 100)}%`,
                          backgroundColor: cat.percent > 90 ? "var(--color-destructive)" : cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expenses list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {sortedExpenses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No expenses this month.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {sortedExpenses.map(expense => {
                const cat = stats.byCat.find(c => c.name === expense.category)
                return (
                  <div key={expense.id} className="flex items-center gap-3 py-3">
                    <div className="size-2 rounded-full shrink-0" style={{ background: cat?.color || "#94a3b8" }} />
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">{expense.description || expense.category}</span>
                      <span className="text-xs text-muted-foreground">
                        {expense.category} &middot; {new Date(expense.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-medium text-foreground">{formatCurrency(expense.amount, currencySymbol)}</span>
                      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => {
                        removeExpense(expense.id)
                        trackEvent("expense_removed")
                        toast({ title: "Expense removed" })
                      }}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
