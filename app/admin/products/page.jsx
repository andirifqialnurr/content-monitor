import { AdminFilterForm } from "@/components/admin/admin-filter-form";
import { AdminProductsTable } from "@/components/admin/admin-products-table";
import { readAdminListFilters } from "@/lib/admin-filter-params";
import { prisma } from "@/lib/prisma";
import { getAdminProducts } from "@/server/modules/admin/admin.service";
import { PageHeader } from "@/components/shared/page-header";

const PRODUCT_FILTERS = {
  status: ["DRAFT", "ACTIVE", "INACTIVE"],
  moderationStatus: ["APPROVED", "REVIEW_REQUIRED", "DISABLED"],
  type: ["EBOOK", "COURSE"],
};

export default async function AdminProductsPage({ searchParams }) {
  const filters = readAdminListFilters(await searchParams, PRODUCT_FILTERS);
  const products = await getAdminProducts(prisma, filters);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Admin"
        title="Products"
        description="Monitoring produk e-book dan course lintas platform, owner, order, enrollment, dan status publish."
      />
      <AdminFilterForm
        action="/admin/products"
        query={filters.query}
        resetHref="/admin/products"
        filters={[
          {
            name: "status",
            label: "Status",
            value: filters.status,
            options: [
              { value: "DRAFT", label: "Draft" },
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ],
          },
          {
            name: "moderationStatus",
            label: "Moderasi",
            value: filters.moderationStatus,
            allLabel: "Semua moderasi",
            options: [
              { value: "APPROVED", label: "Approved" },
              { value: "REVIEW_REQUIRED", label: "Review Required" },
              { value: "DISABLED", label: "Disabled" },
            ],
          },
          {
            name: "type",
            label: "Type",
            value: filters.type,
            options: [
              { value: "EBOOK", label: "E-book" },
              { value: "COURSE", label: "Course" },
            ],
          },
        ]}
      />
      <AdminProductsTable products={products} />
    </div>
  );
}
