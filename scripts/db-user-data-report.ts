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

type UserDataRow = {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: Date
  updatedAt: Date
  isPremium: boolean
  emailVerified: boolean
  jobsCount: bigint
  shiftsCount: bigint
  expensesCount: bigint
  goalsCount: bigint
  budgetCategoriesCount: bigint
  attendanceEventsCount: bigint
  recurringShiftsCount: bigint
  analyticsCacheCount: bigint
  auditLogCount: bigint
  settingsBytes: bigint
  userRowBytes: bigint
}

function toNumber(value: bigint): number {
  return Number(value)
}

async function main() {
  const rows = await prisma.$queryRaw<UserDataRow[]>`
    SELECT
      u.id,
      u.email,
      u.name,
      u.role,
      u."createdAt",
      u."updatedAt",
      u."isPremium",
      u."emailVerified",
      COALESCE(j.cnt, 0)::bigint AS "jobsCount",
      COALESCE(s.cnt, 0)::bigint AS "shiftsCount",
      COALESCE(e.cnt, 0)::bigint AS "expensesCount",
      COALESCE(g.cnt, 0)::bigint AS "goalsCount",
      COALESCE(b.cnt, 0)::bigint AS "budgetCategoriesCount",
      COALESCE(ae.cnt, 0)::bigint AS "attendanceEventsCount",
      COALESCE(rs.cnt, 0)::bigint AS "recurringShiftsCount",
      COALESCE(ac.cnt, 0)::bigint AS "analyticsCacheCount",
      COALESCE(al.cnt, 0)::bigint AS "auditLogCount",
      COALESCE(octet_length(u.settings::text), 0)::bigint AS "settingsBytes",
      pg_column_size(u)::bigint AS "userRowBytes"
    FROM "User" u
    LEFT JOIN (SELECT "userId", COUNT(*) AS cnt FROM "Job" GROUP BY "userId") j ON j."userId" = u.id
    LEFT JOIN (SELECT "userId", COUNT(*) AS cnt FROM "Shift" GROUP BY "userId") s ON s."userId" = u.id
    LEFT JOIN (SELECT "userId", COUNT(*) AS cnt FROM "Expense" GROUP BY "userId") e ON e."userId" = u.id
    LEFT JOIN (SELECT "userId", COUNT(*) AS cnt FROM "Goal" GROUP BY "userId") g ON g."userId" = u.id
    LEFT JOIN (SELECT "userId", COUNT(*) AS cnt FROM "BudgetCategory" GROUP BY "userId") b ON b."userId" = u.id
    LEFT JOIN (SELECT "userId", COUNT(*) AS cnt FROM "AttendanceEvent" GROUP BY "userId") ae ON ae."userId" = u.id
    LEFT JOIN (SELECT "userId", COUNT(*) AS cnt FROM "RecurringShift" GROUP BY "userId") rs ON rs."userId" = u.id
    LEFT JOIN (SELECT "userId", COUNT(*) AS cnt FROM "AnalyticsCache" GROUP BY "userId") ac ON ac."userId" = u.id
    LEFT JOIN (SELECT "userId", COUNT(*) AS cnt FROM "AuditLog" GROUP BY "userId") al ON al."userId" = u.id
    ORDER BY u."createdAt" ASC
  `

  const output = rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isPremium: row.isPremium,
    emailVerified: row.emailVerified,
    dataCounts: {
      jobs: toNumber(row.jobsCount),
      shifts: toNumber(row.shiftsCount),
      expenses: toNumber(row.expensesCount),
      goals: toNumber(row.goalsCount),
      budgetCategories: toNumber(row.budgetCategoriesCount),
      attendanceEvents: toNumber(row.attendanceEventsCount),
      recurringShifts: toNumber(row.recurringShiftsCount),
      analyticsCache: toNumber(row.analyticsCacheCount),
      auditLogs: toNumber(row.auditLogCount),
    },
    approxBytes: {
      userRow: toNumber(row.userRowBytes),
      settingsJson: toNumber(row.settingsBytes),
    },
  }))

  console.log(
    JSON.stringify(
      {
        totalUsers: output.length,
        users: output,
      },
      null,
      2
    )
  )
}

main()
  .catch((error) => {
    console.error("User data report failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
