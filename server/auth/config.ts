import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { loginInputSchema } from "@/server/modules/auth/auth.schema";
import { authenticateUser } from "@/server/modules/auth/auth.service";

export type UserRole = "ADMIN" | "USER";

const sessionMaxAgeSeconds = 24 * 60 * 60;
const sessionMaxAgeMs = sessionMaxAgeSeconds * 1000;

type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
};

type SessionToken = {
  role?: UserRole;
  sessionExpiresAt?: number;
  sessionExpired?: boolean;
  sub?: string;
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: sessionMaxAgeSeconds,
  },
  jwt: {
    maxAge: sessionMaxAgeSeconds,
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
        token.sessionExpiresAt = Date.now() + sessionMaxAgeMs;
        token.sessionExpired = false;
        return token;
      }

      const sessionToken = token as SessionToken;
      const sessionExpiresAt = typeof sessionToken.sessionExpiresAt === "number" ? sessionToken.sessionExpiresAt : null;

      if (!sessionExpiresAt || Date.now() >= sessionExpiresAt) {
        return {
          sessionExpired: true,
          sessionExpiresAt: sessionExpiresAt ?? Date.now(),
        };
      }

      return token;
    },
    async session({ session, token }) {
      const sessionToken = token as SessionToken;
      const sessionExpiresAt = typeof sessionToken.sessionExpiresAt === "number" ? sessionToken.sessionExpiresAt : null;
      const sessionView = session as typeof session & {
        error?: "SessionExpired";
        sessionExpiresAt?: number;
        user?: typeof session.user;
      };

      if (sessionExpiresAt) {
        sessionView.sessionExpiresAt = sessionExpiresAt;
      }

      if (sessionToken.sessionExpired || !sessionExpiresAt || Date.now() >= sessionExpiresAt || !sessionToken.sub) {
        sessionView.error = "SessionExpired";
        delete sessionView.user;
        return session;
      }

      if (session.user) {
        const sessionUser = session.user as typeof session.user & {
          id?: string;
          role?: UserRole;
        };
        sessionUser.id = sessionToken.sub;
        sessionUser.role = sessionToken.role === "ADMIN" ? "ADMIN" : "USER";
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
