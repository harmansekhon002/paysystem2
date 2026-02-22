type PrismaClient = {
  user: { findUnique: (args: unknown) => Promise<unknown> }
  shift: { findMany: (args: unknown) => Promise<unknown> }
  expense: { findMany: (args: unknown) => Promise<unknown> }
  analyticsCache: {
    findUnique: (args: unknown) => Promise<unknown>
    upsert: (args: unknown) => Promise<unknown>
  }
  auditLog: { create: (args: unknown) => Promise<unknown> }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

type PrismaClientConstructor = new (options?: { log?: string[] }) => PrismaClient

const PrismaClientCtor = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@prisma/client")
    return mod.PrismaClient as PrismaClientConstructor
  } catch {
    return null
  }
})()

const prismaClient = globalForPrisma.prisma ??
  (PrismaClientCtor
    ? new PrismaClientCtor({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      })
    : undefined)

if (process.env.NODE_ENV !== "production" && prismaClient) {
  globalForPrisma.prisma = prismaClient
}

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    throw new Error("PrismaClient not available. Run `pnpm db:generate` to generate the client.")
  }
  return prismaClient
}

export const prisma = prismaClient

// Helper functions for common queries
export async function getUserWithRelations(userId: string) {
  return await getPrismaClient().user.findUnique({
    where: { id: userId },
    include: {
      jobs: { where: { isActive: true } },
      shifts: { orderBy: { date: "desc" }, take: 100 },
      expenses: { orderBy: { date: "desc" }, take: 100 },
      goals: { where: { isCompleted: false } },
      budgets: true,
    },
  })
}

export async function getShiftsInRange(userId: string, startDate: Date, endDate: Date) {
  return await getPrismaClient().shift.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: { job: true },
    orderBy: { date: "asc" },
  })
}

export async function getExpensesInRange(userId: string, startDate: Date, endDate: Date) {
  return await getPrismaClient().expense.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  })
}

export async function getCachedAnalytics(userId: string, metric: string, period: string) {
  const cache = await getPrismaClient().analyticsCache.findUnique({
    where: {
      userId_metric_period: { userId, metric, period },
    },
  })

  if (cache && cache.validUntil > new Date()) {
    return cache.value
  }

  return null
}

export async function setCachedAnalytics(
  userId: string,
  metric: string,
  period: string,
  value: number,
  ttl: number = 3600000 // 1 hour default
) {
  const validUntil = new Date(Date.now() + ttl)

  await getPrismaClient().analyticsCache.upsert({
    where: {
      userId_metric_period: { userId, metric, period },
    },
    update: { value, validUntil },
    create: { userId, metric, period, value, validUntil },
  })
}

export async function logAction(userId: string, action: string, entity: string, entityId: string, changes?: unknown) {
  await getPrismaClient().auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      changes,
    },
  })
}
