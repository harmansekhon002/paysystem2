import type { ComponentType } from "react"

export type NavItem = {
    label: string
    href: string
    icon: ComponentType<{ className?: string }>
}

export type ThemeMode = "light" | "dark" | "love"
