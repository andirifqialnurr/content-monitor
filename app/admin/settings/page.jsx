import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AdminSettingsPage() {
  return (
    <ModulePlaceholder
      eyebrow="Admin"
      title="Platform Settings"
      description="Konfigurasi global aplikasi seperti payment provider, batas upload, dan policy platform."
      items={["Payment provider", "Upload limits", "Allowed MIME types", "Platform fee", "Feature flags"]}
    />
  );
}
