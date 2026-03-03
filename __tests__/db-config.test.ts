import { afterEach, describe, expect, it } from "vitest"
import { getDatabaseProvider, getDatabaseUrl } from "@/lib/db-config"

const oldEnv = { ...process.env }

afterEach(() => {
  process.env = { ...oldEnv }
})

describe("db-config", () => {
  it("prioritizes PRIMARY_DATABASE_URL", () => {
    process.env.PRIMARY_DATABASE_URL = "primary-url"
    process.env.DATABASE_URL = "default-url"
    expect(getDatabaseUrl()).toBe("primary-url")
  })

  it("normalizes provider aliases", () => {
    process.env.DATABASE_PROVIDER = "postgresql"
    expect(getDatabaseProvider()).toBe("postgres")
  })
})
