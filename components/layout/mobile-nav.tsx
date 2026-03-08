"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn, hapticFeedback } from "@/lib/utils"
import type { NavItem, ThemeMode } from "./nav-types"

export function MobileBottomNav({ items, mode, onNavigate, isVisible }: { items: NavItem[]; mode: ThemeMode; onNavigate?: () => void; isVisible: boolean }) {
    const pathname = usePathname()
    const router = useRouter()
    const normalizedPathname = pathname.replace(/\/$/, "") || "/"

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out md:hidden",
                isVisible ? "translate-y-0" : "translate-y-full",
            )}
        >
            {/* Safe area padding block (required for modern iOS but handled generally via pb) */}
            <nav
                className={cn(
                    "flex items-center justify-around border-t px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl shadow-[0_-4px_16px_rgba(0,0,0,0.05)]",
                    mode === "light"
                        ? "border-orange-200/50 bg-white/90"
                        : mode === "love"
                            ? "border-pink-900/30 bg-[#250009]/90" // Match dark love theme base
                            : "border-border/60 bg-card/90"
                )}
            >
                {items.map((item) => {
                    const normalizedHref = item.href.replace(/\/$/, "") || "/"
                    const isDashboardAlias = normalizedHref === "/dashboard" && (normalizedPathname === "/" || normalizedPathname === "/dashboard")
                    const isActive = isDashboardAlias || normalizedPathname === normalizedHref
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onMouseEnter={() => router.prefetch(item.href)}
                            onClick={() => {
                                hapticFeedback(12)
                                onNavigate?.()
                            }}
                            className={cn(
                                "flex flex-1 flex-col items-center justify-center gap-1 min-w-[64px] rounded-xl py-1 transition-[transform,color,background-color] duration-200",
                                isActive
                                    ? mode === "light"
                                        ? "text-orange-600 scale-105"
                                        : mode === "love"
                                            ? "text-rose-500 scale-105"
                                            : "text-primary scale-105"
                                    : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
                            )}
                        >
                            <div className={cn("relative flex items-center justify-center", isActive && "after:absolute after:-bottom-1 after:h-1 after:w-1 after:rounded-full after:bg-current")}>
                                <item.icon className={cn("size-6", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                            </div>
                            <span className="text-[11px] font-semibold leading-none">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
