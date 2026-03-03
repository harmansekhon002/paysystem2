import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type IdempotencyRow = {
  wasInserted: boolean
  requestHash: string
  statusCode: number | null
  responseBody: Record<string, unknown> | null
  inProgress: boolean
}

type PrepareIdempotencyOptions = {
  req: NextRequest
  scope: string
  ownerKey: string
  payload: unknown
  ttlHours?: number
}

let ensureTablePromise: Promise<void> | null = null

function stableNormalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableNormalize(entry))
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    )
    const normalized: Record<string, unknown> = {}
    for (const [key, entry] of entries) {
      normalized[key] = stableNormalize(entry)
    }
    return normalized
  }

  return value
}

function hashString(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex")
}

async function ensureIdempotencyTableInitialized() {
  if (!ensureTablePromise) {
    ensureTablePromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "IdempotencyKey" (
          "id" TEXT PRIMARY KEY,
          "scope" TEXT NOT NULL,
          "idempotencyKey" TEXT NOT NULL,
          "ownerKey" TEXT NOT NULL,
          "requestHash" TEXT NOT NULL,
          "statusCode" INTEGER,
          "responseBody" JSONB,
          "inProgress" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "expiresAt" TIMESTAMPTZ NOT NULL
        );
      `)

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "IdempotencyKey_scope_idempotencyKey_ownerKey_key"
        ON "IdempotencyKey" ("scope", "idempotencyKey", "ownerKey");
      `)

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "IdempotencyKey_expiresAt_idx"
        ON "IdempotencyKey" ("expiresAt");
      `)
    })().catch((error) => {
      ensureTablePromise = null
      throw error
    })
  }

  await ensureTablePromise
}

function replayJson(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    headers: {
      "x-idempotency-replay": "true",
    },
  })
}

export async function prepareIdempotency({
  req,
  scope,
  ownerKey,
  payload,
  ttlHours = Number(process.env.IDEMPOTENCY_TTL_HOURS ?? "24"),
}: PrepareIdempotencyOptions) {
  const normalizedTtlHours = Number.isFinite(ttlHours) && ttlHours > 0 ? ttlHours : 24
  const key = req.headers.get("x-idempotency-key")?.trim()
  if (!key) {
    return {
      replay: null as NextResponse | null,
      finish: async (status: number, body: Record<string, unknown>) =>
        NextResponse.json(body, { status }),
    }
  }

  await ensureIdempotencyTableInitialized()

  const requestHash = hashString(JSON.stringify(stableNormalize(payload)))
  const ownerHash = hashString(ownerKey || "anonymous")

  const [row] = await prisma.$queryRaw<Array<IdempotencyRow>>`
    WITH inserted AS (
      INSERT INTO "IdempotencyKey" (
        "id",
        "scope",
        "idempotencyKey",
        "ownerKey",
        "requestHash",
        "expiresAt"
      )
      VALUES (
        ${crypto.randomUUID()},
        ${scope},
        ${key},
        ${ownerHash},
        ${requestHash},
        NOW() + (${normalizedTtlHours} * INTERVAL '1 hour')
      )
      ON CONFLICT ("scope", "idempotencyKey", "ownerKey") DO NOTHING
      RETURNING TRUE AS "wasInserted"
    )
    SELECT
      COALESCE((SELECT "wasInserted" FROM inserted LIMIT 1), FALSE) AS "wasInserted",
      "requestHash",
      "statusCode",
      "responseBody",
      "inProgress"
    FROM "IdempotencyKey"
    WHERE "scope" = ${scope}
      AND "idempotencyKey" = ${key}
      AND "ownerKey" = ${ownerHash}
      AND "expiresAt" > NOW()
    LIMIT 1
  `

  if (!row) {
    return {
      replay: null as NextResponse | null,
      finish: async (status: number, body: Record<string, unknown>) =>
        NextResponse.json(body, { status }),
    }
  }

  if (row.requestHash !== requestHash) {
    return {
      replay: NextResponse.json(
        {
          error: "Idempotency key was already used with a different payload.",
          code: "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_BODY",
        },
        { status: 409 }
      ),
      finish: async (status: number, body: Record<string, unknown>) =>
        NextResponse.json(body, { status }),
    }
  }

  if (row.statusCode !== null && !row.inProgress && row.responseBody) {
    return {
      replay: replayJson(row.statusCode, row.responseBody),
      finish: async (status: number, body: Record<string, unknown>) =>
        NextResponse.json(body, { status }),
    }
  }

  if (!row.wasInserted && row.inProgress) {
    return {
      replay: NextResponse.json(
        {
          error: "An equivalent request is already being processed.",
          code: "IDEMPOTENCY_REQUEST_IN_PROGRESS",
        },
        { status: 409 }
      ),
      finish: async (status: number, body: Record<string, unknown>) =>
        NextResponse.json(body, { status }),
    }
  }

  return {
    replay: null as NextResponse | null,
    finish: async (status: number, body: Record<string, unknown>) => {
      await prisma.$executeRaw`
        UPDATE "IdempotencyKey"
        SET "statusCode" = ${status},
            "responseBody" = ${body}::jsonb,
            "inProgress" = false,
            "updatedAt" = NOW(),
            "expiresAt" = NOW() + (${normalizedTtlHours} * INTERVAL '1 hour')
        WHERE "scope" = ${scope}
          AND "idempotencyKey" = ${key}
          AND "ownerKey" = ${ownerHash}
      `

      return NextResponse.json(body, { status })
    },
  }
}
