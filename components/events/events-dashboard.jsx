"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EventsSchedulerCalendar } from "@/components/events/events-scheduler-calendar";

export function EventsDashboard() {
  return (
    <div className="grid gap-4">
      <PageHeader
        title="Events"
        description="Jadwal publikasi konten dengan mode month, week, 3 days, day, year, dan schedule."
      />

      <EventsSchedulerCalendar />
    </div>
  );
}
