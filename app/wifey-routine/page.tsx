import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"
import { WifeyRoutine } from "@/components/wifey-routine"

export default async function WifeyRoutinePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login?callbackUrl=/wifey-routine")
  }

  return (
    <AppShell>
      <WifeyRoutine />
    </AppShell>
  )
}
