import crypto from "crypto"

export function generateRawToken(size = 32): string {
  return crypto.randomBytes(size).toString("hex")
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function createTokenPair() {
  const token = generateRawToken(32)
  return {
    token,
    tokenHash: hashToken(token),
  }
}
