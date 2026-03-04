'use client'

import { useEffect, useState } from "react"
import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

function resolveToastThemeClass(): string {
  if (typeof document === "undefined") return "border-border/70 bg-gradient-to-br from-card via-card to-muted/50 text-foreground"
  if (document.querySelector(".love-theme")) {
    return "border-rose-300/70 bg-gradient-to-br from-rose-500/95 via-pink-500/92 to-orange-500/90 text-white shadow-rose-500/35"
  }
  if (document.documentElement.classList.contains("dark")) {
    return "border-emerald-300/30 bg-gradient-to-br from-slate-950 via-emerald-900/90 to-blue-900/95 text-emerald-100"
  }
  return "border-amber-200/80 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 text-orange-900"
}

export function Toaster() {
  const { toasts } = useToast()
  const [themeClass, setThemeClass] = useState(() => resolveToastThemeClass())

  useEffect(() => {
    const sync = () => setThemeClass(resolveToastThemeClass())
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, className, ...props }) {
        return (
          <Toast key={id} className={className ?? themeClass} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
