import { PrismaClient } from "@prisma/client"
import { getDatabaseProvider, getDatabaseUrl } from "@/lib/db-config"

const globalForPrisma = globalThis as { prisma?: PrismaClient }
const databaseUrl = getDatabaseUrl()
const databaseProvider = getDatabaseProvider()

if (!databaseUrl) {
  console.error(
    "No database URL found. Expected PRIMARY_DATABASE_URL, DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL."
  )
} else if (databaseProvider !== "unknown") {
  console.info(`[db] Provider configured: ${databaseProvider}`)
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
