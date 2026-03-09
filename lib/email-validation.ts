import dns from "dns"
import { promisify } from "util"
import { isSpecialUserEmail } from "@/lib/special-user"

const resolveMx = promisify(dns.resolveMx)
const MX_LOOKUP_TIMEOUT_MS = Number(process.env.EMAIL_MX_TIMEOUT_MS ?? "1200")
const MX_CACHE_TTL_MS = Number(process.env.EMAIL_MX_CACHE_TTL_MS ?? "3600000")

type DomainValidationResult = { valid: boolean; error?: string }
type CachedDomainValidation = DomainValidationResult & { expiresAt: number }

const domainValidationCache = new Map<string, CachedDomainValidation>()

// Common disposable/temporary email domains to block
const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com",
  "throwaway.email",
  "guerrillamail.com",
  "mailinator.com",
  "10minutemail.com",
  "trashmail.com",
  "sharklasers.com",
  "getairmail.com",
  "temp-mail.org",
  "fakeinbox.com",
  "yopmail.com",
  "maildrop.cc",
])

// Well-known valid email providers (for quick validation without DNS lookup)
const KNOWN_VALID_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "protonmail.com",
  "aol.com",
  "mail.com",
  "zoho.com",
  "fastmail.com",
  "hey.com",
  "tutanota.com",
  "gmx.com",
  "pm.me",
  // Allow common test domains for development
  "test.com",
  "example.com",
  "localhost",
])

// Domains that should bypass validation (e.g., for testing or admin accounts)
const WHITELISTED_DOMAINS = new Set([
  "sekhon.com",
  "love.com",
])

/**
 * Validate email domain by checking:
 * 1. Not a disposable/temporary email
 * 2. Either a known valid domain OR has valid MX records
 */
export async function isValidEmailDomain(email: string): Promise<{ valid: boolean; error?: string }> {
  const emailLower = email.toLowerCase().trim()
  
  // Always allow special user emails (bypass domain validation)
  if (isSpecialUserEmail(emailLower)) {
    return { valid: true }
  }
  
  const domain = emailLower.split("@")[1]

  if (!domain) {
    return { valid: false, error: "Invalid email format" }
  }

  // Allow whitelisted domains
  if (WHITELISTED_DOMAINS.has(domain)) {
    return { valid: true }
  }

  const cached = domainValidationCache.get(domain)
  if (cached && cached.expiresAt > Date.now()) {
    return { valid: cached.valid, error: cached.error }
  }

  // Block disposable email domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, error: "Temporary email addresses are not allowed" }
  }

  // Allow known valid domains without DNS lookup
  if (KNOWN_VALID_DOMAINS.has(domain)) {
    return { valid: true }
  }

  // Check MX records for unknown domains
  try {
    const timeoutMs = Number.isFinite(MX_LOOKUP_TIMEOUT_MS) && MX_LOOKUP_TIMEOUT_MS > 0
      ? MX_LOOKUP_TIMEOUT_MS
      : 1200

    const mxRecords = await Promise.race([
      resolveMx(domain),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(Object.assign(new Error("MX lookup timeout"), { code: "ETIMEOUT" }))
        }, timeoutMs)
      }),
    ])

    if (mxRecords && mxRecords.length > 0) {
      const result = { valid: true }
      domainValidationCache.set(domain, {
        ...result,
        expiresAt: Date.now() + (Number.isFinite(MX_CACHE_TTL_MS) && MX_CACHE_TTL_MS > 0 ? MX_CACHE_TTL_MS : 3600000),
      })
      return result
    }
    const result = { valid: false, error: "Email domain does not exist or cannot receive emails" }
    domainValidationCache.set(domain, { ...result, expiresAt: Date.now() + 3600000 })
    return result
  } catch (error: unknown) {
    // DNS lookup failed
    const errCode = (error as { code?: string })?.code
    if (errCode === "ENOTFOUND" || errCode === "ENODATA") {
      const result = { valid: false, error: "Email domain does not exist" }
      domainValidationCache.set(domain, { ...result, expiresAt: Date.now() + 3600000 })
      return result
    }
    // For other DNS errors (timeout, etc), allow registration but log warning
    console.warn(`DNS check failed for ${domain}:`, error)
    const result = { valid: true }
    domainValidationCache.set(domain, { ...result, expiresAt: Date.now() + 5 * 60 * 1000 })
    return result
  }
}

/**
 * Synchronous basic email format validation
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
