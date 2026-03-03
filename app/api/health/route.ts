import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logServerError } from "@/lib/server-ops"
import { getDbMetricsSnapshot } from "@/lib/db-metrics"
import { getDatabaseProvider } from "@/lib/db-config"

function getStorageAlertState() {
  const usage = Number(process.env.DB_STORAGE_USAGE_PERCENT ?? "")
  const threshold = Number(process.env.DB_STORAGE_ALERT_PERCENT ?? "85")

  if (!Number.isFinite(usage)) {
    return {
      configured: false,
      thresholdPercent: threshold,
      usagePercent: null as number | null,
      isAlerting: false,
    }
  }

  return {
    configured: true,
    thresholdPercent: threshold,
    usagePercent: usage,
    isAlerting: usage >= threshold,
  }
}

export async function GET() {
  const startedAt = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1 as ok`
    const storage = getStorageAlertState()

    return NextResponse.json({
      ok: true,
      service: "shiftwise-api",
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      database: {
        provider: getDatabaseProvider(),
        storage,
        writeFailureMetrics: getDbMetricsSnapshot(),
      },
    })
  } catch (error) {
    const errorId = logServerError("health-check", error)
    return NextResponse.json(
      {
        ok: false,
        service: "shiftwise-api",
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
        error: "Health check failed",
        errorId,
        database: {
          provider: getDatabaseProvider(),
          storage: getStorageAlertState(),
          writeFailureMetrics: getDbMetricsSnapshot(),
        },
      },
      { status: 503 }
    )
  }
}
