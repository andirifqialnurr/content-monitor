import { redirect } from "next/navigation";
import { StatisticsDashboard } from "@/components/statistics/statistics-dashboard";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import { getUserStatistics } from "@/server/modules/statistics/statistics.service";

export default async function StatisticsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/statistics");
  }

  const statistics = await getUserStatistics(prisma, user.id);

  return <StatisticsDashboard statistics={statistics} />;
}
