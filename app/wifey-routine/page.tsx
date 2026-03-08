import dynamic from "next/dynamic"
import { AppShell } from "@/components/app-shell"

const WifeyRoutine = dynamic(() => import("@/components/wifey-routine").then((mod) => mod.WifeyRoutine), {
  loading: () => <div className="flex h-96 items-center justify-center">Loading routine...</div>,
})

export default function WifeyRoutinePage() {
  return (
    <AppShell>
      <WifeyRoutine />
    </AppShell>
  )
}
