"use client"

import { AppShell } from "@/components/app-shell"
import { BudgetPlanner } from "@/components/budget-planner"

export default function BudgetPage() {
  return (
    <AppShell>
      <BudgetPlanner />
    </AppShell>
  )
}
