import { redirect } from "next/navigation"
import dynamic from "next/dynamic"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { AppShell } from "@/components/app-shell"

const WifeyRoutine = dynamic(() => import("@/components/wifey-routine").then((mod) => mod.WifeyRoutine), {
  loading: () => <div className="flex h-96 items-center justify-center">Loading routine...</div>,
})

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
