"use client";

import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/react";

const typeLabels = {
  VIDEO_SHORT: "Video Short",
  CAROUSEL_POST: "Carousel Post",
  BLOG: "Blog",
  LONG_VIDEO: "Long Video",
};

export function EventsContentList() {
  const contentItems = trpc.contentItems.list.useQuery({ status: "SCHEDULED" });

  return (
    <Card>
      <CardHeader>
        <CardDescription>ContentItem</CardDescription>
        <CardTitle>Konten Terjadwal</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {contentItems.isLoading && <p className="text-sm text-muted-foreground">Memuat event konten...</p>}
        {contentItems.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Belum ada konten berstatus scheduled. Tambahkan dari Bank Konten.
          </p>
        )}

        {contentItems.data?.map((item) => (
          <article key={item.id} className="grid gap-2 rounded-md border bg-muted/20 p-3 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{item.title}</h2>
                <Badge variant="secondary">{typeLabels[item.type] ?? item.type}</Badge>
              </div>
              {item.body && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>}
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="size-4" />
              {formatEventRange(item)}
            </p>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

function formatEventRange(item) {
  const startAt = item.startAt ?? item.scheduledAt;

  if (!startAt) {
    return "Belum dijadwalkan";
  }

  const startDate = new Date(startAt);
  const endDate = item.endAt ? new Date(item.endAt) : null;

  if (!endDate) {
    return startDate.toLocaleString("id-ID");
  }

  if (item.allDay) {
    const displayEndDate = new Date(endDate);
    displayEndDate.setDate(displayEndDate.getDate() - 1);

    return `${startDate.toLocaleDateString("id-ID")} - ${displayEndDate.toLocaleDateString("id-ID")}`;
  }

  return `${startDate.toLocaleString("id-ID")} - ${endDate.toLocaleString("id-ID")}`;
}
