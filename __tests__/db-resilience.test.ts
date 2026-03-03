import { describe, expect, it } from "vitest"
import { Prisma } from "@prisma/client"
import { classifyDbFailure } from "@/lib/db-resilience"

describe("classifyDbFailure", () => {
  it("classifies storage full errors from message", () => {
    const error = new Error("No space left on device")
    expect(classifyDbFailure(error)).toBe("storage_full")
  })

  it("classifies table not ready from P2021", () => {
    const error = new Prisma.PrismaClientKnownRequestError("table missing", {
      code: "P2021",
      clientVersion: "6.2.0",
    })

    expect(classifyDbFailure(error)).toBe("table_not_ready")
  })

  it("classifies unknown errors safely", () => {
    expect(classifyDbFailure(new Error("something else"))).toBe("unknown_write_failure")
  })
})
