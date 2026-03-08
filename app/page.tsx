import type { Metadata } from "next"
import LandingPage from "@/components/landing-page"

export const metadata: Metadata = {
  title: "ShiftWise — Shift Tracker for International Students",
  description:
    "Free shift tracker for international students. Track visa work hours, calculate penalty rates, manage budgets and hit savings goals while studying abroad.",
  alternates: { canonical: "/" },
}

export default function Page() {
  return <LandingPage />
}
