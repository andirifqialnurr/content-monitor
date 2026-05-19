import { EventsDashboard } from "@/components/events/events-dashboard";
import { getDashboardData } from "@/lib/content-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const data = await getDashboardData();

  return <EventsDashboard data={data} />;
}
