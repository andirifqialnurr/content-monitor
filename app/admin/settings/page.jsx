import { AdminSettingsForm } from "@/components/admin/admin-settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/server/modules/platform-settings/platform-settings.service";

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings(prisma);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Admin"
        title="Platform Settings"
        description="Konfigurasi global untuk payment, upload policy, dan feature flag operasional platform."
        badge={settings.paymentMode}
      />
      <AdminSettingsForm
        settings={settings}
        environment={{
          midtransServerKeyConfigured: Boolean(process.env.MIDTRANS_SERVER_KEY),
          nextAuthUrlConfigured: Boolean(process.env.NEXTAUTH_URL),
        }}
      />
    </div>
  );
}
