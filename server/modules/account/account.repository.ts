import type { PrismaClient } from "@prisma/client";
import type { UpdateAccountProfileInput } from "@/server/modules/account/account.schema";

const accountProfileSelect = {
  id: true,
  name: true,
  email: true,
  username: true,
  avatarUrl: true,
  bio: true,
  timezone: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function findAccountProfile(prisma: PrismaClient, userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: accountProfileSelect,
  });
}

export function findAccountCredentials(prisma: PrismaClient, userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
    },
  });
}

export function findAccountByUsername(prisma: PrismaClient, username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
}

export function updateAccountProfile(
  prisma: PrismaClient,
  userId: string,
  input: UpdateAccountProfileInput,
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      username: input.username,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
      timezone: input.timezone,
      publicPage: {
        upsert: {
          create: {
            username: input.username,
            displayName: input.name,
            bio: input.bio,
          },
          update: {
            username: input.username,
            displayName: input.name,
            bio: input.bio,
          },
        },
      },
    },
    select: accountProfileSelect,
  });
}

export function updateAccountPassword(prisma: PrismaClient, userId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
    select: { id: true },
  });
}
