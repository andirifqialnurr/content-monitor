import Link from "next/link";
import { BookOpen, CheckCircle2, Clock3, FileText, GraduationCap, Layers3, Lock } from "lucide-react";
import { PublicAnalyticsTracker } from "@/components/analytics/public-analytics-tracker";
import { CheckoutButton } from "@/components/products/checkout-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PublicProductSales({ product, checkoutAvailability = { enabled: true, disabledReason: null } }) {
  const isCourse = product.type === "COURSE";
  const lessons = product.modules.flatMap((module) => module.lessons);
  const totalMinutes = lessons.reduce((total, lesson) => total + (lesson.duration ?? 0), 0);

  return (
    <main className="min-h-screen bg-background">
      <PublicAnalyticsTracker productId={product.id} metadata={{ productType: product.type, slug: product.slug }} />
      <section className="mx-auto grid min-h-screen max-w-6xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{isCourse ? "Course" : "E-book"}</Badge>
            <Link className="text-sm text-muted-foreground hover:text-foreground" href={`/${product.user.username}`}>
              {product.user.name ?? product.user.username}
            </Link>
          </div>

          <div className="grid gap-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal md:text-5xl">{product.title}</h1>
            {product.description && (
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">{product.description}</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryPill icon={isCourse ? Layers3 : FileText} label={isCourse ? "Module" : "Format"} value={isCourse ? product.modules.length : "PDF"} />
            <SummaryPill icon={BookOpen} label={isCourse ? "Lesson" : "Akses"} value={isCourse ? lessons.length : "Download"} />
            <SummaryPill icon={Clock3} label="Estimasi" value={totalMinutes > 0 ? `${totalMinutes} menit` : "Mandiri"} />
          </div>

          {isCourse ? <CourseOutline modules={product.modules} /> : <EbookAccess />}
        </div>

        <aside className="lg:sticky lg:top-6">
          <Card>
            {product.coverUrl && (
              <div className="aspect-[4/3] overflow-hidden rounded-t-lg bg-muted">
                <img src={product.coverUrl} alt={product.title} className="h-full w-full object-cover" />
              </div>
            )}
            <CardHeader>
              <CardDescription>Checkout</CardDescription>
              <CardTitle className="text-3xl">{formatPrice(product.price, product.currency)}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <CheckoutButton
                productId={product.id}
                className="w-full"
                analyticsMetadata={{ productType: product.type, slug: product.slug }}
                disabledReason={checkoutAvailability.enabled ? null : checkoutAvailability.disabledReason}
              >
                Beli {isCourse ? "course" : "e-book"}
              </CheckoutButton>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Akses diberikan setelah payment berhasil.
                </p>
                {isCourse && (
                  <p className="flex items-center gap-2">
                    <GraduationCap className="size-4 text-emerald-600" />
                    Course muncul otomatis di Learner Area.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}

function CourseOutline({ modules }) {
  return (
    <section className="grid gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Curriculum</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-normal">Materi Course</h2>
      </div>

      {modules.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Curriculum belum dipublikasikan.</CardContent>
        </Card>
      ) : (
        modules.map((module) => <ModuleCard key={module.id} module={module} />)
      )}
    </section>
  );
}

function ModuleCard({ module }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Module {module.order + 1}</CardDescription>
        <CardTitle className="text-lg">{module.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {module.lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada lesson.</p>
        ) : (
          module.lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{lesson.title}</p>
                <p className="text-xs text-muted-foreground">
                  {lesson.type === "VIDEO" ? "Video" : "Reading"}
                  {lesson.duration ? ` - ${lesson.duration} menit` : ""}
                </p>
              </div>
              {lesson.isPreview ? <Badge variant="secondary">Preview</Badge> : <Lock className="size-4 text-muted-foreground" />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function EbookAccess() {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Akses Produk</CardDescription>
        <CardTitle className="text-lg">File Digital</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed text-muted-foreground">
        Setelah payment berhasil, file e-book bisa dibuka dan diunduh dari halaman status order akun pembeli.
      </CardContent>
    </Card>
  );
}

function SummaryPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <Icon className="mb-3 size-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function formatPrice(price, currency) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}
