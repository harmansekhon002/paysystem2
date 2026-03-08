import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"

const Earnings = dynamic(() => import("@/components/earnings").then(mod => mod.Earnings), {
  loading: () => <div className="flex h-96 items-center justify-center">Loading Earnings...</div>
})

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Earnings | ShiftWise",
  alternates: {
    canonical: "/earnings",
  },
}

export default function EarningsPage() {
  return (
    <AppShell>
      <Earnings />
    </AppShell>
  )
}
