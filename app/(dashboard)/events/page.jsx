import { EventsDashboard } from "@/components/events/events-dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  return <EventsDashboard />;
}
