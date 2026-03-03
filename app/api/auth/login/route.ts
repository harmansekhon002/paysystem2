import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { LoginError, validateLoginCredentials } from "@/lib/auth"
import { logServerError } from "@/lib/server-ops"

export async function POST(req: NextRequest) {
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
