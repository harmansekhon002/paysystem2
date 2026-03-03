import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function parseDatabaseUrl(url?: string) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname,
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//, "") || null,
    }
  } catch {
    return null
  }
}

export async function GET() {
  const selectedUrl =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL ??
    null

  try {
    const [dbInfo] = await prisma.$queryRawUnsafe<Array<{ current_database: string; current_schema: string }>>(
      'SELECT current_database(), current_schema()'
    )

    const [tableInfo] = await prisma.$queryRawUnsafe<Array<{ user_table: string | null }>>(
      `SELECT to_regclass('"User"') AS user_table`
    )

    return NextResponse.json({
      ok: true,
      envUrlParsed: parseDatabaseUrl(selectedUrl ?? undefined),
      dbInfo,
      userTable: tableInfo?.user_table ?? null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        envUrlParsed: parseDatabaseUrl(selectedUrl ?? undefined),
        error: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 }
    )
  }
}
