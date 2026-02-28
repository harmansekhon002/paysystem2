import { Prisma, PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export async function getUserWithRelations(userId: string) {
  return prisma.user.findUnique({
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
  return prisma.shift.findMany({
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
  return prisma.expense.findMany({
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
  const cache = await prisma.analyticsCache.findUnique({
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
  ttl: number = 3600000
) {
  const validUntil = new Date(Date.now() + ttl)

  await prisma.analyticsCache.upsert({
    where: {
      userId_metric_period: { userId, metric, period },
    },
    update: { value, validUntil },
    create: { userId, metric, period, value, validUntil },
  })
}

export async function logAction(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  changes?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      changes,
    },
  })
}
