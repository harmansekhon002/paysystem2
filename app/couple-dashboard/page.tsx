import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"

const CoupleDashboard = dynamic(() => import("@/components/couple-dashboard").then((mod) => mod.CoupleDashboard), {
  loading: () => <div className="flex h-96 items-center justify-center">Loading parent dashboard...</div>,
})

export default function CoupleDashboardPage() {
  return (
    <AppShell>
      <CoupleDashboard />
    </AppShell>
  )
}
