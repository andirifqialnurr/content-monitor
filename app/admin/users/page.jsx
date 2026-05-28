import { AdminFilterForm } from "@/components/admin/admin-filter-form";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { readAdminListFilters } from "@/lib/admin-filter-params";
import { prisma } from "@/lib/prisma";
import { getAdminUsers } from "@/server/modules/admin/admin.service";
import { PageHeader } from "@/components/shared/page-header";

const USER_FILTERS = {
  status: ["ACTIVE", "INACTIVE"],
  role: ["USER", "ADMIN"],
};

export default async function AdminUsersPage({ searchParams }) {
  const filters = readAdminListFilters(await searchParams, USER_FILTERS);
  const users = await getAdminUsers(prisma, filters);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="Monitoring user platform, role, ownership data, public page, dan aktivitas dasar."
      />
      <AdminFilterForm
        action="/admin/users"
        query={filters.query}
        resetHref="/admin/users"
        filters={[
          {
            name: "status",
            label: "Status",
            value: filters.status,
            options: [
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ],
          },
          {
            name: "role",
            label: "Role",
            value: filters.role,
            options: [
              { value: "USER", label: "User" },
              { value: "ADMIN", label: "Admin" },
            ],
          },
        ]}
      />
      <AdminUsersTable users={users} />
    </div>
  );
}
