import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Next.js v16+ renamed "middleware" to "proxy" (same behavior, different file convention).
export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Allow Playwright E2E tests to run without requiring interactive auth.
    if (
        process.env.PLAYWRIGHT_TEST === "true" ||
        req.headers.get("x-playwright-test") === "1"
    ) {
        return NextResponse.next()
    }

    // Allow: auth pages, NextAuth API, Next.js internals, static files
    if (
        pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/api/auth/") ||
        pathname.startsWith("/_next/") ||
        pathname.startsWith("/favicon") ||
        pathname.startsWith("/icon") ||
        pathname.startsWith("/apple-icon") ||
        pathname.includes(".") // any file with extension (images, etc.)
    ) {
        return NextResponse.next()
    }

    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
        const loginUrl = new URL("/login", req.url)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    // Run on all routes — the function itself gates which ones to protect
    matcher: ["/((?!_next/static|_next/image).*)"],
}
