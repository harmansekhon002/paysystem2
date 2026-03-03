import { prisma } from "@/lib/prisma"

const globalForDbInit = globalThis as {
  userTableInitialized?: boolean
  userTableInitPromise?: Promise<void>
}

const USER_TABLE_INIT_STATEMENTS = [
  `
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "name" TEXT,
      "passwordHash" TEXT NOT NULL,
      "emailVerified" BOOLEAN NOT NULL DEFAULT false,
      "verificationToken" TEXT,
      "verificationTokenExpires" TIMESTAMP(3),
      "resetToken" TEXT,
      "resetTokenExpires" TIMESTAMP(3),
      "currency" TEXT NOT NULL DEFAULT 'AUD',
      "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
      "isPremium" BOOLEAN NOT NULL DEFAULT false,
      "premiumUntil" TIMESTAMP(3),
      "stripeCustomerId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "User_pkey" PRIMARY KEY ("id")
    )
  `,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeCustomerId_key" ON "User"("stripeCustomerId")`,
  `CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email")`,
  `CREATE INDEX IF NOT EXISTS "User_verificationToken_idx" ON "User"("verificationToken")`,
  `CREATE INDEX IF NOT EXISTS "User_resetToken_idx" ON "User"("resetToken")`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationToken" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationTokenExpires" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpires" TIMESTAMP(3)`,
]

async function runUserTableInitialization() {
  const [tableInfo] = await prisma.$queryRawUnsafe<Array<{ user_table: string | null }>>(
    `SELECT to_regclass('"User"')::text AS user_table`
  )

  if (tableInfo?.user_table) {
    globalForDbInit.userTableInitialized = true
    return
  }

  for (const statement of USER_TABLE_INIT_STATEMENTS) {
    await prisma.$executeRawUnsafe(statement)
  }

  globalForDbInit.userTableInitialized = true
}

export async function ensureUserTableInitialized(options: { force?: boolean } = {}) {
  if (options.force) {
    globalForDbInit.userTableInitialized = false
    globalForDbInit.userTableInitPromise = undefined
  }

  if (globalForDbInit.userTableInitialized) {
    return
  }

  if (!globalForDbInit.userTableInitPromise) {
    globalForDbInit.userTableInitPromise = runUserTableInitialization().catch(error => {
      globalForDbInit.userTableInitPromise = undefined
      throw error
    })
  }

  await globalForDbInit.userTableInitPromise
}
