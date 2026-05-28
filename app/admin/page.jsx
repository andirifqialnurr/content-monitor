import { AdminOverview } from "@/components/admin/admin-overview";
import { prisma } from "@/lib/prisma";
import { getAdminOverview } from "@/server/modules/admin/admin.service";

export default async function AdminIndexPage() {
  const overview = await getAdminOverview(prisma);

  return <AdminOverview overview={overview} />;
}
