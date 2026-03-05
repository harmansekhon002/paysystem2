import { withAuth } from "next-auth/middleware"

export default withAuth({
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only-do-not-use-in-prod-123456",
})

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth API routes)
         * - api/public (public API routes if any)
         * - login (login page)
         * - register (registration page)
         * - forgot-password (password recovery)
         * - reset-password (password reset)
         * - verify-email (email verification)
         * - pricing (pricing page)
         * - terms (terms page)
         * - privacy (privacy page)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - icon.png, apple-icon.png, etc.
         */
        "/((?!api/auth|api/public|login|register|forgot-password|reset-password|verify-email|pricing|terms|privacy|_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|manifest.webmanifest|icon-).*)",
    ],
}
