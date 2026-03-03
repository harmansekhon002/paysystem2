import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { recordDbWriteFailure, type DbFailureCategory } from "@/lib/db-metrics"
import { logServerError } from "@/lib/server-ops"

const storageFullPatterns = [
  "no space left on device",
  "disk full",
  "database is full",
  "could not extend file",
  "enospc",
  "storage limit",
]

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.toLowerCase()
  return String(error).toLowerCase()
}

export function classifyDbFailure(error: unknown): DbFailureCategory {
  const message = getErrorMessage(error)
  if (storageFullPatterns.some((pattern) => message.includes(pattern))) {
    return "storage_full"
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
    return "table_not_ready"
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "connection_unavailable"
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") {
    return "connection_unavailable"
  }

  return "unknown_write_failure"
}

function createFailureResponse(category: DbFailureCategory, errorId: string) {
  if (category === "storage_full") {
    return NextResponse.json(
      {
        error: "Writes are temporarily unavailable. Please retry shortly.",
        code: "DB_STORAGE_FULL",
        mode: "read_only",
        errorId,
      },
      { status: 503 }
    )
  }

  if (category === "connection_unavailable") {
    return NextResponse.json(
      {
        error: "Database is temporarily unavailable.",
        code: "DB_UNAVAILABLE",
        mode: "degraded",
        errorId,
      },
      { status: 503 }
    )
  }

  if (category === "table_not_ready") {
    return NextResponse.json(
      {
        error: "Database initialization is still in progress. Retry shortly.",
        code: "DB_NOT_READY",
        mode: "degraded",
        errorId,
      },
      { status: 503 }
    )
  }

  return NextResponse.json(
    {
      error: "Request failed due to a server error.",
      code: "DB_WRITE_FAILED",
      errorId,
    },
    { status: 500 }
  )
}

export function handleDbWriteFailure(scope: string, error: unknown) {
  const category = classifyDbFailure(error)
  const errorId = logServerError(scope, error)
  recordDbWriteFailure(category, scope)
  return createFailureResponse(category, errorId)
}
