"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ProgressCircleProps {
  progress: number // 0-100
  size?: number
  strokeWidth?: number
  className?: string
  showPercentage?: boolean
}

export function ProgressCircle({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  showPercentage = true,
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-500 ease-out"
          strokeLinecap="round"
        />
      </svg>
      {showPercentage && (
        <span className="absolute text-sm font-semibold">{Math.round(progress)}%</span>
      )}
    </div>
  )
}

interface LinearProgressProps {
  progress: number // 0-100
  className?: string
  showPercentage?: boolean
  variant?: "default" | "success" | "warning" | "error"
  animated?: boolean
}

export function LinearProgress({
  progress,
  className,
  showPercentage = false,
  variant = "default",
  animated = true,
}: LinearProgressProps) {
  const variantColors = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {showPercentage && (
          <span className="text-sm font-medium text-muted-foreground mb-1">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantColors[variant],
            animated && "animate-pulse"
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  )
}

interface StepProgressProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isComplete = index < currentStep
          const isCurrent = index === currentStep
          const isUpcoming = index > currentStep

          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isComplete && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background text-primary scale-110",
                    isUpcoming && "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span className={cn("mt-2 text-xs", isCurrent ? "font-medium" : "text-muted-foreground")}>
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 h-0.5 bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 bg-primary",
                      isComplete ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn("h-4 rounded bg-muted animate-pulse", className)}
          style={{ width: `${Math.random() * 30 + 70}%` }}
        />
      ))}
    </div>
  )
}

interface SpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className={cn("inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]", sizes[size], className)} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface PulsingDotProps {
  className?: string
  color?: "primary" | "success" | "warning" | "error"
}

export function PulsingDot({ className, color = "primary" }: PulsingDotProps) {
  const colors = {
    primary: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  }

  return (
    <span className={cn("relative flex h-3 w-3", className)}>
      <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", colors[color])} />
      <span className={cn("relative inline-flex h-3 w-3 rounded-full", colors[color])} />
    </span>
  )
}

// Parallax container component
interface ParallaxContainerProps {
  children: React.ReactNode
  speed?: number
  className?: string
}

export function ParallaxContainer({ children, speed = 0.5, className }: ParallaxContainerProps) {
  const [offset, setOffset] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const scrolled = window.scrollY
      const elementTop = rect.top + scrolled
      const offset = (scrolled - elementTop) * speed
      setOffset(offset)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [speed])

  return (
    <div ref={ref} className={cn("will-change-transform", className)} style={{ transform: `translateY(${offset}px)` }}>
      {children}
    </div>
  )
}

// Fade in when in viewport
interface FadeInWhenVisibleProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function FadeInWhenVisible({ children, className, delay = 0 }: FadeInWhenVisibleProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  )
}
