import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { loginInputSchema } from "@/server/modules/auth/auth.schema";
import { authenticateUser } from "@/server/modules/auth/auth.service";

export type UserRole = "ADMIN" | "USER";

type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginInputSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        return authenticateUser(prisma, parsed.data);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const sessionUser = user as SessionUser;
        token.role = sessionUser.role ?? "USER";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as typeof session.user & {
          id?: string;
          role?: UserRole;
        };
        sessionUser.id = token.sub;
        sessionUser.role = token.role === "ADMIN" ? "ADMIN" : "USER";
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
