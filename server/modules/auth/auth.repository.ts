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
