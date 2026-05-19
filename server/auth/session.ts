import { getServerSession } from "next-auth";
import { authOptions, type UserRole } from "@/server/auth/config";

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

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role ?? "USER",
  };
}
