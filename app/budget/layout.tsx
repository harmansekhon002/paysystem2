import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Budget | ShiftWise",
  alternates: {
    canonical: "/budget",
  },
}

export default function BudgetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
