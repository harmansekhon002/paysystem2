import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { CoupleDashboard } from "@/components/couple-dashboard"

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
