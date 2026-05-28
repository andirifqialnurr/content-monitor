import Link from "next/link";
import { ArrowLeft, CalendarDays, FileText } from "lucide-react";
import { PublicAnalyticsTracker } from "@/components/analytics/public-analytics-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const contentTypeLabels = {
  VIDEO_SHORT: "Video Short",
  CAROUSEL_POST: "Carousel Post",
  BLOG: "Blog",
  LONG_VIDEO: "Long Video",
};

export function PublicContentPage({ contentItem }) {
  const publicPage = contentItem.user.publicPage?.isPublished ? contentItem.user.publicPage : null;

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      {publicPage && (
        <PublicAnalyticsTracker
          publicPageId={publicPage.id}
          metadata={{
            contentItemId: contentItem.id,
            contentType: contentItem.type,
            slug: contentItem.slug,
          }}
        />
      )}

      <section className="mx-auto grid max-w-3xl gap-5">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-3">
            <Link href={`/${contentItem.user.username}`}>
              <ArrowLeft className="size-4" />
              Kembali ke @{contentItem.user.username}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{contentTypeLabels[contentItem.type] ?? contentItem.type}</Badge>
            <Link className="text-sm text-muted-foreground hover:text-foreground" href={`/${contentItem.user.username}`}>
              {contentItem.user.name ?? contentItem.user.username}
            </Link>
          </div>

          <h1 className="mt-3 text-4xl font-semibold tracking-normal">{contentItem.title}</h1>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              {formatDate(contentItem.publishedAt ?? contentItem.updatedAt)}
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>Konten publik</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="size-4 text-muted-foreground" />
              Materi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contentItem.body ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{contentItem.body}</div>
            ) : (
              <p className="text-sm text-muted-foreground">Konten belum memiliki body.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
