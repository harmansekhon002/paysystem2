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

type DbSizeRow = {
  total_size_pretty: string
  total_size_bytes: bigint
}

type TableSizeRow = {
  table_name: string
  table_size_pretty: string
  table_size_bytes: bigint
  rows_estimate: number
}

type UserCountRow = {
  users: bigint
}

async function main() {
  const [dbSize] = await prisma.$queryRaw<DbSizeRow[]>`
    SELECT
      pg_size_pretty(pg_database_size(current_database())) AS total_size_pretty,
      pg_database_size(current_database())::bigint AS total_size_bytes
  `

  const tableSizes = await prisma.$queryRaw<TableSizeRow[]>`
    SELECT
      c.relname AS table_name,
      pg_size_pretty(pg_total_relation_size(c.oid)) AS table_size_pretty,
      pg_total_relation_size(c.oid)::bigint AS table_size_bytes,
      COALESCE(s.n_live_tup, 0)::int AS rows_estimate
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
    WHERE c.relkind = 'r'
      AND n.nspname = 'public'
    ORDER BY pg_total_relation_size(c.oid) DESC
  `

  const [userCount] = await prisma.$queryRaw<UserCountRow[]>`
    SELECT COUNT(*)::bigint AS users FROM "User"
  `

  const topTables = tableSizes.slice(0, 12)
  const totalBytes = Number(dbSize?.total_size_bytes ?? 0)
  const userCountNum = Number(userCount?.users ?? 0)
  const bytesPerUser = userCountNum > 0 ? totalBytes / userCountNum : 0

  console.log(
    JSON.stringify(
      {
        database: {
          name: "current_database",
          totalSize: dbSize?.total_size_pretty ?? "0 bytes",
          totalSizeBytes: totalBytes,
          totalSizeMB: Number((totalBytes / 1024 / 1024).toFixed(2)),
        },
        users: {
          count: userCountNum,
          approxBytesPerUser: Math.round(bytesPerUser),
          approxKBPerUser: Number((bytesPerUser / 1024).toFixed(2)),
        },
        largestTables: topTables.map((row) => ({
          table: row.table_name,
          size: row.table_size_pretty,
          sizeBytes: Number(row.table_size_bytes),
          sizeMB: Number((Number(row.table_size_bytes) / 1024 / 1024).toFixed(3)),
          estimatedRows: row.rows_estimate,
        })),
      },
      null,
      2
    )
  )
}

main()
  .catch((error) => {
    console.error("DB size report failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
