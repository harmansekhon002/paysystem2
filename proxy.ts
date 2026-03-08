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
         * Explicitly protect these routes.
         * All other routes (like /, /login, /register, /pricing) will be public.
         */
        "/dashboard/:path*",
        "/admin/:path*",
        "/shifts/:path*",
        "/earnings/:path*",
        "/budget/:path*",
        "/goals/:path*",
        "/analytics/:path*",
        "/settings/:path*",
        "/wifey-routine/:path*",
        "/student-routine/:path*",
        "/couple-dashboard/:path*",
        "/parent-dash/:path*",
        "/api/user/:path*",
        "/api/shifts/:path*",
        "/api/earnings/:path*",
        "/api/budget/:path*",
        "/api/goals/:path*",
        "/api/analytics/:path*",
        "/api/subscription/status",
        "/api/ai/:path*",
    ],
}
