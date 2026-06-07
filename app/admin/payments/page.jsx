import { AdminFilterForm } from "@/components/admin/admin-filter-form";
import { AdminPaymentsTable } from "@/components/admin/admin-payments-table";
import { readAdminListFilters } from "@/lib/admin-filter-params";
import { prisma } from "@/lib/prisma";
import { getAdminPayments } from "@/server/modules/admin/admin.service";
import { PageHeader } from "@/components/shared/page-header";

const PAYMENT_FILTERS = {
  status: ["PENDING", "PAID", "FAILED", "EXPIRED", "REFUNDED"],
  provider: ["MIDTRANS", "XENDIT"],
};

export default async function AdminPaymentsPage({ searchParams }) {
  const filters = readAdminListFilters(await searchParams, PAYMENT_FILTERS);
  const payments = await getAdminPayments(prisma, filters);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Admin"
        title="Payments"
        description="Monitoring transaksi payment gateway, webhook, status provider, dan order terkait."
      />
      <AdminFilterForm
        action="/admin/payments"
        query={filters.query}
        resetHref="/admin/payments"
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
          {
            name: "provider",
            label: "Provider",
            value: filters.provider,
            options: [
              { value: "MIDTRANS", label: "Midtrans" },
              { value: "XENDIT", label: "Xendit" },
            ],
          },
        ]}
      />
      <AdminPaymentsTable payments={payments} />
    </div>
  );
}
