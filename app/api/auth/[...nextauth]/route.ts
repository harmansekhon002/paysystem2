import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)
const isProduction = process.env.NODE_ENV === "production"

function missingSecretResponse() {
  return NextResponse.json(
    { error: "Server auth configuration is incomplete (NEXTAUTH_SECRET)." },
    { status: 503 }
  )
}

export async function GET(req: Request, ctx: unknown) {
  if (isProduction && !process.env.NEXTAUTH_SECRET) {
    return missingSecretResponse()
  }

  try {
    return await handler(req, ctx as never)
  } catch (error) {
    console.error("NextAuth GET handler failed:", error)
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 500 })
  }
}

export async function POST(req: Request, ctx: unknown) {
  if (isProduction && !process.env.NEXTAUTH_SECRET) {
    return missingSecretResponse()
  }

  try {
    return await handler(req, ctx as never)
  } catch (error) {
    console.error("NextAuth POST handler failed:", error)
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 500 })
  }
}
