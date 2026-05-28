import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { prisma } from "@/lib/prisma";
import { getAdminOrders } from "@/server/modules/admin/admin.service";
import { PageHeader } from "@/components/shared/page-header";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders(prisma);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Admin"
        title="Orders"
        description="Monitoring order lintas platform untuk investigasi transaksi dan akses produk."
      />
      <AdminOrdersTable orders={orders} />
    </div>
  );
}
