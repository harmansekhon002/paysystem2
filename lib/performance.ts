import React from "react"

// Performance optimization utilities

// Lazy loading component wrapper
export function lazyLoadComponent<TProps extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<TProps> }>,
  fallback: React.ReactNode = null
): React.ComponentType<TProps> {
  const LazyComponent = React.lazy(importFunc)

  const Wrapped = (props: TProps) =>
    React.createElement(
      React.Suspense,
      { fallback },
      React.createElement(LazyComponent, props)
    )

  Wrapped.displayName = "LazyLoadComponent"
  return Wrapped
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null

  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

// Throttle function
export function throttle<T extends (...args: unknown[]) => unknown>(func: T, limit: number): T {
  let inThrottle: boolean = false

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }) as T
}

// Memoization helper
export function memoize<T extends (...args: unknown[]) => unknown>(func: T): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = func(...args) as ReturnType<T>
    cache.set(key, result)
    return result
  }) as T
}

// Virtual list configuration
export interface VirtualListConfig {
  itemHeight: number
  overscan?: number
  windowHeight?: number
}

export function useVirtualList<T>(items: T[], config: VirtualListConfig) {
  const [scrollTop, setScrollTop] = React.useState(0)
  const { itemHeight, overscan = 3, windowHeight = 600 } = config

  const visibleRange = React.useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(items.length - 1, Math.ceil((scrollTop + windowHeight) / itemHeight) + overscan)

    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, items.length, overscan, windowHeight])

  const visibleItems = React.useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index,
    }))
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight

  return {
    visibleItems,
    totalHeight,
    scrollTop,
    setScrollTop,
    visibleRange,
  }
}

// Image lazy loading
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = React.useState(placeholder || "")
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      setImageSrc(src)
      setIsLoaded(true)
    }
  }, [src])

  return { imageSrc, isLoaded }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = React.useState(false)

  React.useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [ref, options])

  return isIntersecting
}

// Code splitting helper
export const codeSplitRoutes = {
  dashboard: () => import("../app/page"),
  shifts: () => import("../app/shifts/page"),
  earnings: () => import("../app/earnings/page"),
  budget: () => import("../app/budget/page"),
  goals: () => import("../app/goals/page"),
  pricing: () => import("../app/pricing/page"),
}

// Bundle size analyzer
export function analyzeBundleSize() {
  if (typeof window === "undefined") return

  const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[]

  const sizes = entries
    .filter(entry => entry.initiatorType === "script" || entry.initiatorType === "link")
    .map(entry => ({
      name: entry.name,
      size: entry.transferSize,
      duration: entry.duration,
    }))

  console.table(sizes)
  return sizes
}

// Web Worker utility
export function createWebWorker(workerFunction: (...args: unknown[]) => void) {
  const blob = new Blob([`(${workerFunction.toString()})()`], { type: "application/javascript" })
  const url = URL.createObjectURL(blob)
  return new Worker(url)
}

// Local Storage with compression
export const compressedStorage = {
  set(key: string, value: unknown): void {
    try {
      const json = JSON.stringify(value)
      // Simple run-length encoding for repeated patterns
      const compressed = json.replace(/(.)\1{2,}/g, (match, char) => `${char}*${match.length}`)
      localStorage.setItem(key, compressed)
    } catch (error) {
      console.error("Failed to save to compressed storage:", error)
    }
  },

  get<T>(key: string): T | null {
    try {
      const compressed = localStorage.getItem(key)
      if (!compressed) return null

      // Decompress
      const json = compressed.replace(/(.)\*(\d+)/g, (match, char, count) => char.repeat(Number(count)))
      return JSON.parse(json) as T
    } catch (error) {
      console.error("Failed to read from compressed storage:", error)
      return null
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key)
  },
}

// Request batching
export class RequestBatcher<T, R> {
  private queue: Array<{ params: T; resolve: (value: R) => void; reject: (error: unknown) => void }> = []
  private timer: NodeJS.Timeout | null = null
  private batchFunction: (params: T[]) => Promise<R[]>
  private delay: number

  constructor(batchFunction: (params: T[]) => Promise<R[]>, delay: number = 50) {
    this.batchFunction = batchFunction
    this.delay = delay
  }

  add(params: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ params, resolve, reject })

      if (this.timer) clearTimeout(this.timer)

      this.timer = setTimeout(() => this.flush(), this.delay)
    })
  }

  private async flush() {
    if (this.queue.length === 0) return

    const batch = [...this.queue]
    this.queue = []

    try {
      const params = batch.map(item => item.params)
      const results = await this.batchFunction(params)

      batch.forEach((item, index) => {
        item.resolve(results[index])
      })
    } catch (error) {
      batch.forEach(item => item.reject(error))
    }
  }
}

// Performance monitoring
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`${name} took ${(end - start).toFixed(2)}ms`)
}

export async function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  console.log(`${name} took ${(end - start).toFixed(2)}ms`)
  return result
}

// Cache with TTL
export class TTLCache<K, V> {
  private cache = new Map<K, { value: V; expires: number }>()
  private defaultTTL: number

  constructor(defaultTTL: number = 60000) {
    // 60 seconds default
    this.defaultTTL = defaultTTL
  }

  set(key: K, value: V, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { value, expires })
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  has(key: K): boolean {
    return this.get(key) !== undefined
  }

  delete(key: K): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key)
      }
    }
  }
}

// Prefetch data on hover
export function usePrefetch<T>(fetchFunction: () => Promise<T>, delay: number = 100) {
  const cache = React.useRef<T | null>(null)
  const [isPrefetching, setIsPrefetching] = React.useState(false)

  const prefetch = React.useCallback(() => {
    if (cache.current || isPrefetching) return

    setIsPrefetching(true)
    setTimeout(async () => {
      try {
        cache.current = await fetchFunction()
      } catch (error) {
        console.error("Prefetch failed:", error)
      } finally {
        setIsPrefetching(false)
      }
    }, delay)
  }, [fetchFunction, delay, isPrefetching])

  const getData = React.useCallback(async (): Promise<T> => {
    if (cache.current) return cache.current
    cache.current = await fetchFunction()
    return cache.current
  }, [fetchFunction])

  return { prefetch, getData, isPrefetching }
}
