import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Goals | ShiftWise",
  alternates: {
    canonical: "/goals",
  },
}

export default function GoalsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
