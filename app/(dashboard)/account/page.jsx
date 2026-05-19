import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { LogoutButton } from "@/components/auth/logout-button";

export default function AccountPage() {
  return (
    <div className="grid gap-4">
      <ModulePlaceholder
        eyebrow="Profile"
        title="Account"
        description="Pengaturan akun pengguna, username publik, avatar, timezone, security, dan notifikasi."
        items={["Profile user", "Username publik", "Email", "Password/security", "Avatar", "Timezone", "Logout"]}
      />
      <div>
        <LogoutButton />
      </div>
    </div>
  );
}
