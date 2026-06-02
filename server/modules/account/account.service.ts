import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type {
  ChangePasswordInput,
  UpdateAccountProfileInput,
} from "@/server/modules/account/account.schema";
import {
  findAccountByUsername,
  findAccountCredentials,
  findAccountProfile,
  updateAccountPassword,
  updateAccountProfile,
} from "@/server/modules/account/account.repository";
import { hashPassword, verifyPassword } from "@/server/shared/password";
import { assertRateLimit } from "@/server/shared/rate-limit";

const passwordChangeRateLimitWindowMs = 15 * 60 * 1000;

export async function getAccountProfile(prisma: PrismaClient, userId: string) {
  const user = await findAccountProfile(prisma, userId);

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Account tidak ditemukan.",
    });
  }

  return user;
}

export async function saveAccountProfile(
  prisma: PrismaClient,
  userId: string,
  input: UpdateAccountProfileInput,
) {
  const current = await getAccountProfile(prisma, userId);

  if (input.username !== current.username) {
    const existingUsername = await findAccountByUsername(prisma, input.username);

    if (existingUsername && existingUsername.id !== userId) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Username sudah dipakai.",
      });
    }
  }

  return updateAccountProfile(prisma, userId, input);
}

export async function changeAccountPassword(
  prisma: PrismaClient,
  userId: string,
  input: ChangePasswordInput,
) {
  assertRateLimit({
    key: `change-password:${userId}`,
    limit: 5,
    windowMs: passwordChangeRateLimitWindowMs,
    message: "Terlalu banyak percobaan ganti password. Coba lagi nanti.",
  });

  const user = await findAccountCredentials(prisma, userId);

  if (!user?.passwordHash) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Account ini belum memiliki password credentials.",
    });
  }

  const validCurrentPassword = await verifyPassword(input.currentPassword, user.passwordHash);

  if (!validCurrentPassword) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Password saat ini tidak valid.",
    });
  }

  if (input.currentPassword === input.newPassword) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Password baru harus berbeda dari password saat ini.",
    });
  }

  const passwordHash = await hashPassword(input.newPassword);
  await updateAccountPassword(prisma, userId, passwordHash);

  return { ok: true };
}
