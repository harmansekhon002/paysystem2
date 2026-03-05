"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { NavItem, ThemeMode } from "./nav-types"

export function SidebarNav({ items, mode, onNavigate }: { items: NavItem[]; mode: ThemeMode; onNavigate?: () => void }) {
    const pathname = usePathname()
    const router = useRouter()
    return (
        <nav className="flex flex-col gap-1">
            {items.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        onMouseEnter={() => router.prefetch(item.href)}
                        className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                            isActive
                                ? mode === "light"
                                    ? "bg-gradient-to-r from-yellow-200/80 via-orange-200/80 to-red-200/75 text-orange-900 shadow-sm"
                                    : "bg-primary/10 text-primary"
                                : mode === "light"
                                    ? "text-muted-foreground hover:bg-gradient-to-r hover:from-yellow-100/70 hover:via-orange-100/70 hover:to-red-100/65 hover:text-orange-900"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        <item.icon className="size-[18px] shrink-0" />
                        {item.label}
                    </Link>
                )
            })}
        </nav>
    )
}
