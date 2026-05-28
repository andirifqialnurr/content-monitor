import { AdminStatisticsDashboard } from "@/components/admin/admin-statistics-dashboard";
import { prisma } from "@/lib/prisma";
import { getAdminPlatformStatistics } from "@/server/modules/admin-statistics/admin-statistics.service";

export default async function AdminStatisticsPage() {
  const statistics = await getAdminPlatformStatistics(prisma);

  return <AdminStatisticsDashboard statistics={statistics} />;
}
