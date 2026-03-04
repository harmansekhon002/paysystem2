import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { LoginError, validateLoginCredentials } from "@/lib/auth"
import { logServerError } from "@/lib/server-ops"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  // Rate limit: 10 login attempts per minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const rl = checkRateLimit(ip, "login", 10, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait and try again.", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    )
  }

  try {
    const body = await req.json()
    const email = String(body?.email ?? "")
    const password = String(body?.password ?? "")

    await validateLoginCredentials(email, password)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const errorId = logServerError("login", error)

    if (error instanceof LoginError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: 401 }
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          error: "Database query failed. Please try again in a few moments.",
          code: "DB_QUERY_FAILED",
          errorId,
        },
        { status: 503 }
      )
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          error: "Database connection failed. Check server configuration and DATABASE_URL.",
          code: "DB_UNAVAILABLE",
          errorId,
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        error: "Login failed due to a server error.",
        code: "UNKNOWN_AUTH_ERROR",
        errorId,
      },
      { status: 500 }
    )
  }
}
