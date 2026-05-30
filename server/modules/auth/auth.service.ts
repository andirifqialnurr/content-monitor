import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/server/shared/password";
import { createUser, findUserByEmail, findUserByUsername, toSessionUser } from "@/server/modules/auth/auth.repository";
import type { LoginInput, RegisterInput } from "@/server/modules/auth/auth.schema";
import { assertRateLimit } from "@/server/shared/rate-limit";

const authRateLimitWindowMs = 15 * 60 * 1000;

export async function registerUser(prisma: PrismaClient, input: RegisterInput) {
  assertRateLimit({
    key: `register:${input.email.toLowerCase()}:${input.username.toLowerCase()}`,
    limit: 5,
    windowMs: authRateLimitWindowMs,
    message: "Terlalu banyak percobaan register. Coba lagi nanti.",
  });

  const [emailUser, usernameUser] = await Promise.all([
    findUserByEmail(prisma, input.email),
    findUserByUsername(prisma, input.username),
  ]);

  if (emailUser) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Email sudah terdaftar.",
    });
  }

  if (usernameUser) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Username sudah dipakai.",
    });
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser(prisma, {
    name: input.name,
    email: input.email,
    username: input.username,
    passwordHash,
  });

  return toSessionUser(user);
}

export async function authenticateUser(prisma: PrismaClient, input: LoginInput) {
  assertRateLimit({
    key: `login:${input.email.toLowerCase()}`,
    limit: 10,
    windowMs: authRateLimitWindowMs,
    message: "Terlalu banyak percobaan login. Coba lagi nanti.",
  });

  const user = await findUserByEmail(prisma, input.email);

  if (!user?.passwordHash) {
    return null;
  }

  if (user.status !== "ACTIVE") {
    return null;
  }

  const valid = await verifyPassword(input.password, user.passwordHash);

  if (!valid) {
    return null;
  }

  return toSessionUser(user);
}
