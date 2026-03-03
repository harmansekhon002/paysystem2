import crypto from "crypto"

export function createErrorId() {
  return crypto.randomBytes(6).toString("hex")
}

export function logServerError(scope: string, error: unknown) {
  const errorId = createErrorId()
  console.error(`[${scope}]`, { errorId, error })
  return errorId
}
