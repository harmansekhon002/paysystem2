import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { ensureUserTableInitialized } from "@/lib/db-init"

export const SPECIAL_USER_EMAIL = (process.env.SPECIAL_USER_EMAIL || "jassu@love.com").toLowerCase().trim()
export const SPECIAL_USER_PASSWORD = process.env.SPECIAL_USER_PASSWORD || "wife"
export const SPECIAL_USER_NAME = process.env.SPECIAL_USER_NAME || "Wifey"

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

export function isSpecialUserEmail(email: string) {
  return normalizeEmail(email) === SPECIAL_USER_EMAIL
}

export function isSpecialCredentials(email: string, password: string) {
  return isSpecialUserEmail(email) && password === SPECIAL_USER_PASSWORD
}

export async function ensureSpecialUserAccount() {
  await ensureUserTableInitialized()

  const existingUser = await prisma.user.findUnique({
    where: { email: SPECIAL_USER_EMAIL },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
    },
  })

  const passwordHash = await bcrypt.hash(SPECIAL_USER_PASSWORD, 12)
  let user = existingUser

  if (!existingUser) {
    user = await prisma.user.create({
      data: {
        email: SPECIAL_USER_EMAIL,
        name: SPECIAL_USER_NAME,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    })
  } else {
    const passwordMatches = await bcrypt.compare(SPECIAL_USER_PASSWORD, existingUser.passwordHash)
    if (!passwordMatches || existingUser.name !== SPECIAL_USER_NAME) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          name: SPECIAL_USER_NAME,
        },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
        },
      })
    }
  }

  if (user) {
    try {
      await prisma.$executeRaw`
        UPDATE "User"
        SET "emailVerified" = true,
            "updatedAt" = NOW()
        WHERE "id" = ${user.id}
      `
    } catch {
      // Older schemas may not have email verification columns.
    }
  }

  if (!user) {
    throw new Error("Failed to initialize special user account")
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name || SPECIAL_USER_NAME,
  }
}
