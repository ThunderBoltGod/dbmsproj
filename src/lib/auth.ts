// src/lib/auth.ts
// NextAuth v5 configuration — Google OAuth + role-based sessions

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // On first sign-in via Google, map the profile to our User model
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        // Update user's full name and image from Google profile if available
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email! },
        });

        if (existingUser) {
          // Update image/name if changed on Google side
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: profile.name || existingUser.name,
              image: (profile as { picture?: string }).picture || existingUser.image,
              emailVerified: new Date(),
            },
          });
        }
      }
      return true;
    },

    // Include user ID and role in the session
    async session({ session, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true, name: true, status: true },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.role = dbUser.role;
          session.user.name = dbUser.name;

          // Block suspended users
          if (dbUser.status === "suspended") {
            return null as unknown as typeof session;
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // Use database sessions (required for PrismaAdapter with OAuth)
  session: { strategy: "database" },
});
