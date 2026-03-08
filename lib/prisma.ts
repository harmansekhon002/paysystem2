import { PrismaClient } from "@prisma/client"
import { getDatabaseProvider, getDatabaseUrl } from "@/lib/db-config"

const globalForPrisma = globalThis as { prisma?: PrismaClient }
const databaseUrl = getDatabaseUrl()
const databaseProvider = getDatabaseProvider()
let prismaClient: PrismaClient | null = null

if (!databaseUrl) {
  console.error(
    "No database URL found. Expected PRIMARY_DATABASE_URL, DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL."
  )
} else if (databaseProvider !== "unknown") {
  console.info(`[db] Provider configured: ${databaseProvider}`)
}

function createPrismaClient() {
  if (!databaseUrl) {
    throw new Error(
      "Database URL is not configured. Set PRIMARY_DATABASE_URL, DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL."
    )
  }

  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
}

function getPrismaClient() {
  if (prismaClient) return prismaClient

  prismaClient = globalForPrisma.prisma ?? createPrismaClient()
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient
  }

  return prismaClient
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient()
    return Reflect.get(client, prop, receiver)
  },
})

