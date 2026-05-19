import { ContentDashboard } from "@/components/content-dashboard";
import { getDashboardData } from "@/lib/content-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();

  return <ContentDashboard data={data} />;
}
