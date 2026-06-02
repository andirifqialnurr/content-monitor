import type { PrismaClient, User } from "@prisma/client";

type CreateUserInput = {
  name: string;
  email: string;
  username: string;
  passwordHash: string;
};

export function findUserByEmail(prisma: PrismaClient, email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export function findUserByUsername(prisma: PrismaClient, username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export function createPasswordResetToken(
  prisma: PrismaClient,
  userId: string,
  tokenHash: string,
  expiresAt: Date,
) {
  return prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
}

export function deleteExpiredPasswordResetTokens(prisma: PrismaClient, now: Date) {
  return prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lte: now } },
        { usedAt: { not: null } },
      ],
    },
  });
}

export function findUsablePasswordResetToken(prisma: PrismaClient, tokenHash: string, now: Date) {
  return prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now },
      user: {
        status: "ACTIVE",
      },
    },
    include: {
      user: true,
    },
  });
}

export async function resetUserPassword(
  prisma: PrismaClient,
  resetTokenId: string,
  userId: string,
  passwordHash: string,
) {
  return prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetTokenId },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        userId,
        id: { not: resetTokenId },
        usedAt: null,
      },
      data: { usedAt: new Date() },
    }),
  ]);
}

export function createUser(prisma: PrismaClient, input: CreateUserInput) {
  return prisma.user.create({
    data: {
      ...input,
      role: "USER",
    },
  });
}

export function toSessionUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
