import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { prisma } from "@/lib/prisma";
import { getAdminUsers } from "@/server/modules/admin/admin.service";
import { PageHeader } from "@/components/shared/page-header";

export default async function AdminUsersPage() {
  const users = await getAdminUsers(prisma);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="Monitoring user platform, role, ownership data, public page, dan aktivitas dasar."
      />
      <AdminUsersTable users={users} />
    </div>
  );
}
