import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AdminUsersPage() {
  return (
    <ModulePlaceholder
      eyebrow="Admin"
      title="Users"
      description="Pengelolaan user platform. Route ini nanti hanya bisa diakses role ADMIN."
      items={["User list", "User status", "Activity summary", "Role view", "Disable user"]}
    />
  );
}
