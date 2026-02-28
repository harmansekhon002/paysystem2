"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, X, ExternalLink, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAppData } from "@/components/data-provider"
import {
    generateNotifications,
    requestNotificationPermission,
    showBrowserNotification,
    type AppNotification,
} from "@/lib/notifications"
import Link from "next/link"

const STORAGE_KEY = "shiftwise_read_notifications"

function getReadIds(): Set<string> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return new Set(raw ? JSON.parse(raw) : [])
    } catch {
        return new Set()
    }
}

function saveReadIds(ids: Set<string>) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
    } catch { }
}

const TYPE_COLORS: Record<string, string> = {
    shift: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    budget: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    goal: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    earnings: "bg-green-500/15 text-green-600 dark:text-green-400",
    payday: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
    motivation: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
    milestone: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
}

export function NotificationCenter() {
    const { data } = useAppData()
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [readIds, setReadIds] = useState<Set<string>>(new Set())
    const panelRef = useRef<HTMLDivElement>(null)
    const btnRef = useRef<HTMLButtonElement>(null)

    // Generate notifications from data
    useEffect(() => {
        const generated = generateNotifications(data)
        const storedRead = getReadIds()
        setReadIds(storedRead)
        setNotifications(generated.map((n) => ({ ...n, read: storedRead.has(n.id) })))
    }, [data])

    // Request browser push permission on mount
    useEffect(() => {
        requestNotificationPermission()
    }, [])

    // Close panel on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target as Node) &&
                btnRef.current &&
                !btnRef.current.contains(e.target as Node)
            ) {
                setOpen(false)
            }
        }
        if (open) document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [open])

    const unreadCount = notifications.filter((n) => !n.read).length

    const markRead = useCallback(
        (id: string) => {
            const next = new Set(readIds).add(id)
            setReadIds(next)
            saveReadIds(next)
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            )
        },
        [readIds]
    )

    const markAllRead = useCallback(() => {
        const next = new Set(notifications.map((n) => n.id))
        setReadIds(next)
        saveReadIds(next)
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }, [notifications])

    // Show browser notification for new unread notifications when tab is not visible
    useEffect(() => {
        if (unreadCount > 0) {
            const unread = notifications.filter((n) => !n.read).slice(0, 1)[0]
            if (unread && document.hidden) {
                showBrowserNotification(unread.title, { body: unread.body, tag: unread.id })
            }
        }
    }, [unreadCount, notifications])

    return (
        <div className="relative">
            {/* Bell button */}
            <Button
                ref={btnRef}
                variant="ghost"
                size="icon"
                className="relative size-8 text-muted-foreground hover:text-foreground"
                onClick={() => {
                    setOpen((v) => !v)
                }}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </Button>

            {/* Panel */}
            {open && (
                <div
                    ref={panelRef}
                    className="absolute right-0 top-10 z-50 w-[340px] rounded-2xl border border-border bg-card shadow-xl shadow-black/10 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Bell className="size-4 text-primary" />
                            <span className="text-sm font-semibold text-foreground">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[11px] font-semibold text-primary">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={markAllRead}
                                >
                                    <CheckCheck className="size-3" />
                                    Mark all read
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-foreground"
                                onClick={() => setOpen(false)}
                            >
                                <X className="size-3.5" />
                            </Button>
                        </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-[420px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                                <Bell className="size-8 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {notifications.map((n) => (
                                    <NotificationItem
                                        key={n.id}
                                        notification={n}
                                        onRead={() => markRead(n.id)}
                                        onClose={() => setOpen(false)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function NotificationItem({
    notification: n,
    onRead,
    onClose,
}: {
    notification: AppNotification
    onRead: () => void
    onClose: () => void
}) {
    const colorClass = TYPE_COLORS[n.type] ?? "bg-secondary text-muted-foreground"
    const content = (
        <div
            className={cn(
                "flex gap-3 px-4 py-3.5 transition-colors",
                n.read
                    ? "bg-transparent hover:bg-secondary/50"
                    : "bg-primary/[0.04] hover:bg-primary/[0.07]"
            )}
            onClick={onRead}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onRead()}
        >
            {/* Emoji badge */}
            <div
                className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl text-base",
                    colorClass
                )}
            >
                {n.emoji}
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <span className={cn("text-[13px] font-semibold leading-tight", n.read ? "text-muted-foreground" : "text-foreground")}>
                        {n.title}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                        {!n.read && (
                            <span className="size-1.5 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                        {n.link && (
                            <ExternalLink className="size-3 text-muted-foreground/60 shrink-0" />
                        )}
                    </div>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {n.body}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground/60">
                    {n.timestamp.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                </p>
            </div>
        </div>
    )

    if (n.link) {
        return (
            <Link href={n.link} onClick={() => { onRead(); onClose() }}>
                {content}
            </Link>
        )
    }
    return content
}
