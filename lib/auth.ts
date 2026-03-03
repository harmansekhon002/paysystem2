import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { ensureUserTableInitialized } from "@/lib/db-init"

export type LoginErrorCode =
  | "MISSING_CREDENTIALS"
  | "ACCOUNT_NOT_FOUND"
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

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    throw new LoginError("INVALID_PASSWORD", "Incorrect password")
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
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
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
