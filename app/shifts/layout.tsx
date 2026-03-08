import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shifts | ShiftWise",
  alternates: {
    canonical: "/shifts",
  },
}

export default function ShiftsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
