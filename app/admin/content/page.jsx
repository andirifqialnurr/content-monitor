import { AdminContentTable } from "@/components/admin/admin-content-table";
import { prisma } from "@/lib/prisma";
import { getAdminContentItems } from "@/server/modules/admin/admin.service";
import { PageHeader } from "@/components/shared/page-header";

export default async function AdminContentPage() {
  const contentItems = await getAdminContentItems(prisma);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Admin"
        title="Content Moderation"
        description="Monitoring konten lintas user, status publish, jadwal, dan keterkaitan ke public page block."
      />
      <AdminContentTable contentItems={contentItems} />
    </div>
  );
}
