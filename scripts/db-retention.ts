import { PrismaClient } from "@prisma/client"
import { getDatabaseUrl } from "../lib/db-config"

const databaseUrl = getDatabaseUrl()

if (!databaseUrl) {
  console.error(
    "Missing database URL. Expected PRIMARY_DATABASE_URL, DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL."
  )
  process.exit(1)
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
  log: ["error"],
})

function parseDays(value: string | undefined, defaultDays: number) {
  const parsed = Number(value ?? defaultDays)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultDays
}

async function main() {
  const execute = process.argv.includes("--execute")
  const auditRetentionDays = parseDays(process.env.AUDIT_LOG_RETENTION_DAYS, 90)
  const analyticsRetentionDays = parseDays(process.env.ANALYTICS_CACHE_RETENTION_DAYS, 30)

  const now = Date.now()
  const auditCutoff = new Date(now - auditRetentionDays * 24 * 60 * 60 * 1000)
  const analyticsCutoff = new Date(now - analyticsRetentionDays * 24 * 60 * 60 * 1000)

  const [idempotencyTableInfo] = await prisma.$queryRaw<Array<{ exists: string | null }>>`
    SELECT to_regclass('"IdempotencyKey"') as exists
  `
  const hasIdempotencyTable = Boolean(idempotencyTableInfo?.exists)

  const [expiredAnalyticsCount, oldAuditCount, expiredIdempotencyCount] = await Promise.all([
    prisma.analyticsCache.count({
      where: {
        OR: [{ validUntil: { lt: new Date() } }, { updatedAt: { lt: analyticsCutoff } }],
      },
    }),
    prisma.auditLog.count({ where: { createdAt: { lt: auditCutoff } } }),
    hasIdempotencyTable
      ? prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint as count
          FROM "IdempotencyKey"
          WHERE "expiresAt" < NOW()
        `.then((rows) => Number(rows[0]?.count ?? 0))
      : Promise.resolve(0),
  ])

  console.log(
    JSON.stringify(
      {
        mode: execute ? "execute" : "dry-run",
        analyticsCache: {
          retentionDays: analyticsRetentionDays,
          candidates: expiredAnalyticsCount,
        },
        auditLog: {
          retentionDays: auditRetentionDays,
          candidates: oldAuditCount,
        },
        idempotencyKey: {
          enabled: hasIdempotencyTable,
          candidates: expiredIdempotencyCount,
        },
      },
      null,
      2
    )
  )

  if (!execute) {
    console.log("Dry run complete. Re-run with --execute to delete records.")
    return
  }

  const [deletedAnalytics, deletedAuditLogs, deletedIdempotency] = await Promise.all([
    prisma.analyticsCache.deleteMany({
      where: {
        OR: [{ validUntil: { lt: new Date() } }, { updatedAt: { lt: analyticsCutoff } }],
      },
    }),
    prisma.auditLog.deleteMany({ where: { createdAt: { lt: auditCutoff } } }),
    hasIdempotencyTable
      ? prisma.$executeRaw`
          DELETE FROM "IdempotencyKey"
          WHERE "expiresAt" < NOW()
        `
      : Promise.resolve(0),
  ])

  console.log(
    JSON.stringify(
      {
        deleted: {
          analyticsCache: deletedAnalytics.count,
          auditLog: deletedAuditLogs.count,
          idempotencyKey: Number(deletedIdempotency),
        },
      },
      null,
      2
    )
  )
}

main()
  .catch((error) => {
    console.error("Retention job failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
