import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { ensureUserTableInitialized } from "@/lib/db-init"

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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        const normalizedEmail = credentials.email.toLowerCase().trim()
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
          } else {
            throw error
          }
        }

        if (!user) {
          throw new Error("No account found with that email")
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
          throw new Error("Incorrect password")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
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
