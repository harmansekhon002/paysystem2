import { redirect } from "next/navigation"
import dynamic from "next/dynamic"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"

const CoupleDashboard = dynamic(() => import("@/components/couple-dashboard").then((mod) => mod.CoupleDashboard), {
  loading: () => <div className="flex h-96 items-center justify-center">Loading parent dashboard...</div>,
})

export default async function CoupleDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login?callbackUrl=/couple-dashboard")
  }

  return (
    <AppShell>
      <CoupleDashboard />
    </AppShell>
  )
}
