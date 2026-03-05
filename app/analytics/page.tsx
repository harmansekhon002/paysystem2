import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"

const ReportingDashboard = dynamic(() => import("@/components/reporting").then(mod => mod.ReportingDashboard), {
  loading: () => <div className="flex h-96 items-center justify-center">Loading Analytics...</div>
})

export default function AnalyticsPage() {
  return (
    <AppShell>
      <ReportingDashboard />
    </AppShell>
  )
}
