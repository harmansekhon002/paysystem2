"use client"

import { Heart, PawPrint, Sparkles } from "lucide-react"

export function WifeySplash({ name }: { name: string }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-gradient-to-br from-rose-100 via-orange-50 to-emerald-100 px-6 dark:from-rose-950/80 dark:via-amber-950/60 dark:to-emerald-950/80">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-7 text-center shadow-2xl backdrop-blur dark:border-white/10 dark:bg-card/85">
        <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-orange-400 text-white shadow-lg">
          <Heart className="size-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Welcome wifey</h2>
        <p className="mt-2 text-sm text-muted-foreground">Hey {name}, your space is ready with puppy-powered motivation.</p>
        <div className="mt-5 flex items-center justify-center gap-3 text-rose-500">
          <PawPrint className="size-5 animate-bounce" />
          <Sparkles className="size-5 animate-pulse" />
          <PawPrint className="size-5 animate-bounce" />
        </div>
      </div>
    </div>
  )
}
