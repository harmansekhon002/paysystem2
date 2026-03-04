/**
 * Edge-compatible in-memory rate limiter for auth endpoints.
 * Uses a sliding window counter keyed by IP address.
 *
 * Limits:
 *  - /api/auth/login     → 10 attempts per 60 seconds
 *  - /api/auth/register  → 5 attempts per 60 seconds
 */

const DEFAULT_MAX = 10
const DEFAULT_WINDOW_MS = 60_000 // 1 minute

type RateLimitStore = Map<string, { count: number; resetAt: number }>

// In-memory store (works per serverless instance; good enough for Vercel)
const store: RateLimitStore = new Map()

function getKey(ip: string, route: string) {
    return `${ip}:${route}`
}

export function checkRateLimit(
    ip: string,
    route: string,
    max = DEFAULT_MAX,
    windowMs = DEFAULT_WINDOW_MS
): { allowed: boolean; remaining: number; resetAt: number } {
    const key = getKey(ip, route)
    const now = Date.now()

    const entry = store.get(key)

    if (!entry || now > entry.resetAt) {
        // New window
        const resetAt = now + windowMs
        store.set(key, { count: 1, resetAt })
        return { allowed: true, remaining: max - 1, resetAt }
    }

    entry.count += 1

    if (entry.count > max) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt }
    }

    return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt }
}
