"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const DISMISS_KEY = "shiftwise:install-dismissed"

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(true)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone === true
    const dismissed = window.localStorage.getItem(DISMISS_KEY)

    // If it's a timestamp (snooze), check if 24 hours have passed
    let isActuallyDismissed = dismissed === "1"
    if (dismissed && dismissed.length > 1) {
      const dismissDate = parseInt(dismissed)
      if (Date.now() - dismissDate < 24 * 60 * 60 * 1000) {
        isActuallyDismissed = true
      }
    }

    setIsIOS(ios)
    setIsInstalled(Boolean(standalone))
    setHidden(isActuallyDismissed || standalone)
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      // Check if already dismissed or installed before showing
      const dismissed = window.localStorage.getItem(DISMISS_KEY)
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone === true

      // If it's a timestamp (snooze), check if 24 hours have passed
      let isActuallyDismissed = dismissed === "1"
      if (dismissed && dismissed.length > 1) {
        const dismissDate = parseInt(dismissed)
        if (Date.now() - dismissDate < 24 * 60 * 60 * 1000) {
          isActuallyDismissed = true
        }
      }

      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)

      if (!isActuallyDismissed && !standalone) {
        setHidden(false)
      }
    }

    window.addEventListener("beforeinstallprompt", handler as EventListener)
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener)
  }, [])

  const showPrompt = useMemo(() => {
    if (isInstalled || hidden) return false
    if (deferredPrompt) return true
    return isIOS
  }, [deferredPrompt, hidden, isIOS, isInstalled])

  if (!showPrompt) return null

  const dismiss = (permanent = false) => {
    setHidden(true)
    try {
      // If permanent, set to "1", otherwise set current timestamp for a 24h snooze
      window.localStorage.setItem(DISMISS_KEY, permanent ? "1" : Date.now().toString())
    } catch {
      // Ignore storage errors.
    }
  }

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === "accepted") {
      setHidden(true)
      window.localStorage.setItem(DISMISS_KEY, "1")
    }
    setDeferredPrompt(null)
  }

  return (
    <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[114] md:hidden">
      <div className="rounded-xl border border-border/70 bg-card/95 p-3 shadow-lg backdrop-blur-md">
        <div className="flex items-start gap-2">
          <Download className="mt-0.5 size-4 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Install ShiftWise app</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {deferredPrompt
                ? "Add this app to your home screen for a faster, app-like experience."
                : "On iPhone: tap Share, then Add to Home Screen."}
            </p>
          </div>
          <button
            type="button"
            className={cn("rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground")}
            onClick={() => dismiss(true)}
            aria-label="Dismiss install prompt"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {deferredPrompt ? (
            <Button size="sm" className="h-8 px-3 text-xs" onClick={() => void install()}>
              Install
            </Button>
          ) : null}
          <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={() => dismiss(false)}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  )
}
