import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Analytics | ShiftWise",
    alternates: {
        canonical: "/analytics",
    },
}

export default function AnalyticsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
