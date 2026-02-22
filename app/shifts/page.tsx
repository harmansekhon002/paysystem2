"use client"

import { AppShell } from "@/components/app-shell"
import { ShiftsTracker } from "@/components/shifts-tracker"

export default function ShiftsPage() {
  return (
    <AppShell>
      <ShiftsTracker />
    </AppShell>
  )
}
