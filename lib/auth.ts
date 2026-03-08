import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { ensureUserTableInitialized } from "@/lib/db-init"
import { isAdminLogin, getAdminCredentials } from "@/lib/admin-access"
import { ensureSpecialUserAccount, isSpecialCredentials, isSpecialUserEmail } from "@/lib/special-user"

export type LoginErrorCode =
  | "MISSING_CREDENTIALS"
  | "ACCOUNT_NOT_FOUND"
  | "EMAIL_NOT_VERIFIED"
  | "INVALID_PASSWORD"
  | "DB_UNAVAILABLE"
  | "UNKNOWN_AUTH_ERROR"

export class LoginError extends Error {
  code: LoginErrorCode

  constructor(code: LoginErrorCode, message: string) {
    super(message)
    this.name = "LoginError"
    this.code = code
  }
}

export async function validateLoginCredentials(email: string, password: string) {
  if (!email || !password) {
    throw new LoginError("MISSING_CREDENTIALS", "Email and password are required")
  }

  const normalizedEmail = email.toLowerCase().trim()
  if (isAdminLogin(normalizedEmail, password)) {
    const admin = getAdminCredentials()
    return {
      id: "admin-root",
      email: admin.email,
      name: "Admin",
      isSpecialUser: false,
      role: "ADMIN",
    }
  }

  if (isSpecialCredentials(normalizedEmail, password)) {
    const specialUser = await ensureSpecialUserAccount()
    return {
      id: specialUser.id,
      email: specialUser.email,
      name: specialUser.name,
      isSpecialUser: true,
      role: (specialUser as any).role || "USER",
    }
  }

  let user = null

  await ensureUserTableInitialized()

  try {
    user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      await ensureUserTableInitialized({ force: true })
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      throw new LoginError("DB_UNAVAILABLE", "Database connection failed. Please try again later.")
    } else {
      throw error
    }
  }

  if (!user) {
    throw new LoginError("ACCOUNT_NOT_FOUND", "No account found with that email")
  }

  if (user.emailVerified === false) {
    throw new LoginError("EMAIL_NOT_VERIFIED", "Email not verified. Please verify your email before signing in.")
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    throw new LoginError("INVALID_PASSWORD", "Incorrect password")
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isSpecialUser: isSpecialUserEmail(user.email),
    role: user.role,
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          return await validateLoginCredentials(credentials?.email ?? "", credentials?.password ?? "")
        } catch (error) {
          if (error instanceof LoginError) {
            throw new Error(error.message)
          }
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
            throw new Error("Database initialization failed. Please try again in a moment.")
          }
          if (error instanceof Prisma.PrismaClientInitializationError) {
            throw new Error("Database connection failed. Check server configuration.")
          }
          throw error
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const resolvedUserId = typeof user.id === "string"
          ? user.id
          : typeof token.sub === "string"
            ? token.sub
            : token.id
        if (resolvedUserId) {
          token.id = resolvedUserId
        }
        token.email = user.email || token.email
        token.isSpecialUser = Boolean((user as { isSpecialUser?: boolean }).isSpecialUser)
        token.role = (user as { role?: string }).role || "USER"
      } else if (!token.id && typeof token.sub === "string") {
        token.id = token.sub
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (typeof token.id === "string" ? token.id : token.sub) as string
        session.user.isSpecialUser = Boolean(token.isSpecialUser)
          ; (session.user as any).role = token.role || "USER"
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only-do-not-use-in-prod-123456",
}
