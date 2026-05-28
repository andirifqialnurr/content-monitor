import { AdminPaymentsTable } from "@/components/admin/admin-payments-table";
import { prisma } from "@/lib/prisma";
import { getAdminPayments } from "@/server/modules/admin/admin.service";
import { PageHeader } from "@/components/shared/page-header";

export default async function AdminPaymentsPage() {
  const payments = await getAdminPayments(prisma);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Admin"
        title="Payments"
        description="Monitoring transaksi payment gateway, webhook, status provider, dan order terkait."
      />
      <AdminPaymentsTable payments={payments} />
    </div>
  );
}
