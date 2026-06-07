import { AdminFilterForm } from "@/components/admin/admin-filter-form";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { readAdminListFilters } from "@/lib/admin-filter-params";
import { prisma } from "@/lib/prisma";
import { getAdminOrders } from "@/server/modules/admin/admin.service";
import { PageHeader } from "@/components/shared/page-header";

const ORDER_FILTERS = {
  status: ["PENDING", "PAID", "FAILED", "EXPIRED", "REFUNDED"],
};

export default async function AdminOrdersPage({ searchParams }) {
  const filters = readAdminListFilters(await searchParams, ORDER_FILTERS);
  const orders = await getAdminOrders(prisma, filters);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Admin"
        title="Orders"
        description="Monitoring order lintas platform untuk investigasi transaksi dan akses produk."
      />
      <AdminFilterForm
        action="/admin/orders"
        query={filters.query}
        resetHref="/admin/orders"
        filters={[
          {
            name: "status",
            label: "Status",
            value: filters.status,
            options: [
              { value: "PENDING", label: "Pending" },
              { value: "PAID", label: "Paid" },
              { value: "FAILED", label: "Failed" },
              { value: "EXPIRED", label: "Expired" },
              { value: "REFUNDED", label: "Refunded" },
            ],
          },
        ]}
      />
      <AdminOrdersTable orders={orders} />
    </div>
  );
}
