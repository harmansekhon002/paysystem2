type SupportedProvider = "neon" | "postgres" | "supabase" | "rds" | "unknown"

const providerAliasMap: Record<string, SupportedProvider> = {
  neon: "neon",
  postgresql: "postgres",
  postgres: "postgres",
  supabase: "supabase",
  rds: "rds",
}

export function getDatabaseProvider(): SupportedProvider {
  const raw = (process.env.DATABASE_PROVIDER ?? "").trim().toLowerCase()
  if (!raw) return "unknown"
  return providerAliasMap[raw] ?? "unknown"
}

export function getDatabaseUrl() {
  return (
    process.env.PRIMARY_DATABASE_URL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL
  )
}
