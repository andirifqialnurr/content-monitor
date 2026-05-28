import { AdminFilterForm } from "@/components/admin/admin-filter-form";
import { AdminContentTable } from "@/components/admin/admin-content-table";
import { readAdminListFilters } from "@/lib/admin-filter-params";
import { prisma } from "@/lib/prisma";
import { getAdminContentItems } from "@/server/modules/admin/admin.service";
import { PageHeader } from "@/components/shared/page-header";

const CONTENT_FILTERS = {
  status: ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"],
  type: ["VIDEO_SHORT", "CAROUSEL_POST", "BLOG", "LONG_VIDEO"],
};

export default async function AdminContentPage({ searchParams }) {
  const filters = readAdminListFilters(await searchParams, CONTENT_FILTERS);
  const contentItems = await getAdminContentItems(prisma, filters);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Admin"
        title="Content Moderation"
        description="Monitoring konten lintas user, status publish, jadwal, dan keterkaitan ke public page block."
      />
      <AdminFilterForm
        action="/admin/content"
        query={filters.query}
        resetHref="/admin/content"
        filters={[
          {
            name: "status",
            label: "Status",
            value: filters.status,
            options: [
              { value: "DRAFT", label: "Draft" },
              { value: "SCHEDULED", label: "Scheduled" },
              { value: "PUBLISHED", label: "Published" },
              { value: "ARCHIVED", label: "Archived" },
            ],
          },
          {
            name: "type",
            label: "Type",
            value: filters.type,
            options: [
              { value: "VIDEO_SHORT", label: "Short Video" },
              { value: "CAROUSEL_POST", label: "Carousel" },
              { value: "BLOG", label: "Blog" },
              { value: "LONG_VIDEO", label: "Long Video" },
            ],
          },
        ]}
      />
      <AdminContentTable contentItems={contentItems} />
    </div>
  );
}
