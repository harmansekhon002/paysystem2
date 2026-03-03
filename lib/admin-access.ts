const DEFAULT_ADMIN_EMAIL = "admin@admin.com"
const DEFAULT_ADMIN_PASSWORD = "admin123"

export function getAdminCredentials() {
  return {
    email: (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).toLowerCase().trim(),
    password: process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD,
  }
}

export function isAdminLogin(email: string, password: string) {
  const admin = getAdminCredentials()
  const normalizedEmail = email.toLowerCase().trim()
  return (normalizedEmail === admin.email || normalizedEmail === "admin") && password === admin.password
}
