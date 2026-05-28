import { getServerSession } from "next-auth";
import { authOptions, type UserRole } from "@/server/auth/config";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: UserRole;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | {
        id?: string;
        email?: string | null;
        name?: string | null;
        role?: UserRole;
      }
    | undefined;

  if (!user?.id) {
    return null;
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  if (!currentUser || currentUser.status !== "ACTIVE") {
    return null;
  }

  return {
    id: currentUser.id,
    email: currentUser.email,
    name: currentUser.name,
    role: currentUser.role,
  };
}
