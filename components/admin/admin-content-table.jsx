import { FileWarning } from "lucide-react";
import { AdminStatusBadge, formatDateTime, formatPerson } from "@/components/admin/admin-shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const contentTypeLabels = {
  VIDEO_SHORT: "Video Short",
  CAROUSEL_POST: "Carousel",
  BLOG: "Blog",
  LONG_VIDEO: "Long Video",
};

export function AdminContentTable({ contentItems }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Konten lintas user</CardDescription>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileWarning className="size-4 text-muted-foreground" />
          {contentItems.length} Konten
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {contentItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada konten.</p>
        ) : (
          contentItems.map((contentItem) => <ContentRow key={contentItem.id} contentItem={contentItem} />)
        )}
      </CardContent>
    </Card>
  );
}

function ContentRow({ contentItem }) {
  return (
    <article className="grid gap-3 rounded-md border bg-muted/20 p-3 xl:grid-cols-[minmax(0,1fr)_140px_140px_160px] xl:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <AdminStatusBadge status={contentItem.status} />
          <h2 className="truncate font-semibold">{contentItem.title}</h2>
          <Badge variant="outline">{contentTypeLabels[contentItem.type] ?? contentItem.type}</Badge>
        </div>
        <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
          <span>Owner: {formatPerson(contentItem.user)}</span>
          <span>Slug: {contentItem.slug ?? "-"}</span>
          <span>Updated: {formatDateTime(contentItem.updatedAt)}</span>
          <span>Scheduled: {formatDateTime(contentItem.startAt ?? contentItem.scheduledAt)}</span>
        </div>
      </div>

      <Summary label="Blocks" value={contentItem._count.pageBlocks} />
      <Summary label="All day" value={contentItem.allDay ? "Yes" : "No"} />
      <Summary label="Published" value={formatDateTime(contentItem.publishedAt)} />
    </article>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-md border bg-background p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
