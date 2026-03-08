
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"

const Dashboard = dynamic(() => import("@/components/dashboard").then(mod => mod.Dashboard), {
  loading: () => <div className="flex h-96 items-center justify-center">Loading Dashboard...</div>
})

export const metadata: Metadata = {
  title: "Dashboard | ShiftWise",
  alternates: {
    canonical: "/dashboard",
  },
}

export default function HomePage() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  )
}
