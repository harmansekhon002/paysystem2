"use client"

import { useEffect, useMemo, useState } from "react"
import { Heart, PawPrint, Sparkles } from "lucide-react"
import { SPECIAL_CELEBRATION_EVENT } from "@/lib/special-features"

type Burst = {
  id: number
  feature: string
}

const GLYPHS = [Heart, PawPrint, Sparkles]

export function LoveCelebration({ enabled }: { enabled: boolean }) {
  const [bursts, setBursts] = useState<Burst[]>([])

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    const onCelebrate = (event: Event) => {
      const detail = (event as CustomEvent<{ feature?: string }>).detail
      const id = Date.now() + Math.floor(Math.random() * 1000)
      setBursts(prev => [...prev, { id, feature: detail?.feature || "Special moment" }])
      window.setTimeout(() => {
        setBursts(prev => prev.filter(burst => burst.id !== id))
      }, 2000)
    }

    window.addEventListener(SPECIAL_CELEBRATION_EVENT, onCelebrate)
    return () => window.removeEventListener(SPECIAL_CELEBRATION_EVENT, onCelebrate)
  }, [enabled])

  const particles = useMemo(
    () =>
      bursts.flatMap((burst) =>
        Array.from({ length: 18 }, (_, index) => {
          const Icon = GLYPHS[index % GLYPHS.length]
          const left = `${5 + Math.random() * 90}%`
          const delay = `${Math.random() * 0.4}s`
          const duration = `${1.2 + Math.random() * 1.2}s`
          const rotate = `${Math.random() * 40 - 20}deg`

          return {
            burstId: burst.id,
            key: `${burst.id}-${index}`,
            Icon,
            left,
            delay,
            duration,
            rotate,
            color:
              index % 3 === 0
                ? "text-pink-500"
                : index % 3 === 1
                  ? "text-orange-400"
                  : "text-emerald-400",
          }
        })
      ),
    [bursts]
  )

  if (!enabled) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden" aria-hidden="true">
      {particles.map((particle) => (
        <div
          key={particle.key}
          className="love-float absolute bottom-4"
          style={{
            left: particle.left,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
            transform: `rotate(${particle.rotate})`,
          }}
        >
          <particle.Icon className={`size-5 drop-shadow ${particle.color}`} />
        </div>
      ))}
      {bursts.map((burst) => (
        <div key={`label-${burst.id}`} className="absolute top-6 right-6 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-primary shadow-md">
          {burst.feature}
        </div>
      ))}
    </div>
  )
}
