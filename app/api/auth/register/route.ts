import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { ensureUserTableInitialized } from "@/lib/db-init"
import { createTokenPair } from "@/lib/security-tokens"
import { handleDbWriteFailure } from "@/lib/db-resilience"
import { prepareIdempotency } from "@/lib/idempotency"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
})

type RegisterResult = {
  status: number
  body: Record<string, unknown>
}

async function registerUser(name: string, normalizedEmail: string, password: string): Promise<RegisterResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (existingUser) {
    return {
      status: 409,
      body: { error: "An account with this email already exists" },
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const { token, tokenHash } = createTokenPair()
  const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
    },
    select: { id: true, email: true, name: true },
  })

  await prisma.$executeRaw`
    UPDATE "User"
    SET "emailVerified" = false,
        "verificationToken" = ${tokenHash},
        "verificationTokenExpires" = ${tokenExpires},
        "updatedAt" = NOW()
    WHERE "id" = ${user.id}
  `

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const verificationUrl = `${appUrl}/verify-email?token=${token}`

  return {
    status: 201,
    body: { user, verificationUrl },
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 })
    }

    const { name, email, password } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()
    const idempotency = await prepareIdempotency({
      req,
      scope: "auth-register",
      ownerKey: normalizedEmail,
      payload: parsed.data,
    })
    if (idempotency.replay) {
      return idempotency.replay
    }

    await ensureUserTableInitialized()

    try {
      const result = await registerUser(name, normalizedEmail, password)
      return idempotency.finish(result.status, result.body)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
        await ensureUserTableInitialized({ force: true })
        const result = await registerUser(name, normalizedEmail, password)
        return idempotency.finish(result.status, result.body)
      }
      throw error
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
      }
    }

    return handleDbWriteFailure("register", error)
  }
}
