import { getCurrentUser } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";

export async function createTRPCContext() {
  const user = await getCurrentUser();

  return {
    prisma,
    user,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
