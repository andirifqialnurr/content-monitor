import { BarChart3, BookOpenCheck, CreditCard, GraduationCap, MousePointerClick, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";

export function StatisticsDashboard({ statistics }) {
  const { summary, productPerformance } = statistics;

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Analytics"
        title="Statistics"
        description="Ringkasan performa produk, checkout, pembelian, enrollment, progress belajar, dan quiz."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BarChart3} label="Page views" value={summary.pageViews} detail={`${summary.linkClicks} link click`} />
        <MetricCard icon={CreditCard} label="Revenue" value={formatPrice(summary.revenue, "IDR")} detail={`${summary.purchases} paid order`} />
        <MetricCard icon={GraduationCap} label="Enrollment" value={summary.activeEnrollments} detail={`${summary.completedEnrollments} course selesai`} />
        <MetricCard icon={Trophy} label="Quiz score" value={summary.averageQuizScore} detail={`${summary.quizAttempts} attempt`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardDescription>Produk</CardDescription>
            <CardTitle className="text-lg">Product Performance</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {productPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada produk untuk dihitung.</p>
            ) : (
              productPerformance.map((product) => <ProductPerformanceRow key={product.id} product={product} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Conversion</CardDescription>
            <CardTitle className="text-lg">Funnel Awal</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FunnelItem label="Product click ke purchase" value={summary.clickToPurchaseRate} />
            <FunnelItem label="Checkout ke purchase" value={summary.checkoutToPurchaseRate} />
            <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
              <p>Checkout started: {summary.checkoutStarted}</p>
              <p>Purchase completed: {summary.purchaseEvents}</p>
              <p>Course started: {summary.courseStarted}</p>
              <p>Lesson completed: {summary.lessonCompleted}</p>
              <p>Quiz submitted: {summary.quizSubmitted}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription className="flex items-center gap-2">
          <Icon className="size-4" />
          {label}
        </CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function ProductPerformanceRow({ product }) {
  return (
    <article className="grid gap-3 rounded-md border bg-muted/20 p-3 lg:grid-cols-[minmax(0,1fr)_140px_140px_140px] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{product.type === "COURSE" ? "Course" : "E-book"}</Badge>
          <h2 className="truncate font-semibold">{product.title}</h2>
          <Badge variant="outline">{product.status}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">/{product.slug}</p>
      </div>

      <MiniStat icon={MousePointerClick} label="Click" value={product.productClicks} />
      <MiniStat icon={CreditCard} label="Paid" value={product.purchases} />
      <MiniStat icon={BookOpenCheck} label="Revenue" value={formatPrice(product.revenue, product.currency)} />

      <div className="lg:col-span-4">
        <FunnelItem label="Click to purchase" value={product.conversionRate} />
      </div>
    </article>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md border bg-background p-2">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function FunnelItem({ label, value }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <Progress value={value} />
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
