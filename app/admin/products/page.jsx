import { AdminProductsTable } from "@/components/admin/admin-products-table";
import { prisma } from "@/lib/prisma";
import { getAdminProducts } from "@/server/modules/admin/admin.service";
import { PageHeader } from "@/components/shared/page-header";

export default async function AdminProductsPage() {
  const products = await getAdminProducts(prisma);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Admin"
        title="Products"
        description="Monitoring produk e-book dan course lintas platform, owner, order, enrollment, dan status publish."
      />
      <AdminProductsTable products={products} />
    </div>
  );
}
