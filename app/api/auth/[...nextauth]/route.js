import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Only include Google provider if credentials are provided
const providers = [
  CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email och lösenord krävs")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          throw new Error("Ogiltig email eller lösenord")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error("Ogiltig email eller lösenord")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
];

// Add Google provider only if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  );
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists, if not create them
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          })

          if (!dbUser) {
            // Create new user
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || user.email.split('@')[0],
                emailVerified: new Date(),
                image: user.image,
              }
            })
          }

          // Update user object with database ID so it's available in jwt callback
          user.id = dbUser.id
          return true
        } catch (error) {
          console.error("Error in signIn callback:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // Initial sign in - user object is available
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      
      // For Google OAuth, ensure we have the user ID
      if (account?.provider === "google" && !token.id && user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          })
          if (dbUser) {
            token.id = dbUser.id
          }
        } catch (error) {
          console.error("Error fetching user in jwt callback:", error)
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        // Get user ID from token
        if (token?.id) {
          session.user.id = token.id
        } else if (token?.email) {
          // Fallback: fetch from database if not in token
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: token.email }
            })
            if (dbUser) {
              session.user.id = dbUser.id
            }
          } catch (error) {
            console.error("Error fetching user in session callback:", error)
          }
        }
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

