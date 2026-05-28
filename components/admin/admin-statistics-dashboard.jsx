import { BookOpenCheck, CreditCard, GraduationCap, MousePointerClick, Package, Users } from "lucide-react";
import { AdminStatisticsCharts } from "@/components/admin/admin-statistics-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";

export function AdminStatisticsDashboard({ statistics }) {
  const { summary, topProducts, topCreators } = statistics;

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Admin"
        title="Platform Statistics"
        description="Statistik global untuk user, creator aktif, produk, order, revenue, dan performa platform."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Users" value={summary.totalUsers} detail={`${summary.activeUsers} active user`} />
        <MetricCard icon={Package} label="Products" value={summary.totalProducts} detail={`${summary.activeProducts} active product`} />
        <MetricCard icon={CreditCard} label="Revenue" value={formatPrice(summary.revenue, "IDR")} detail={`${summary.paidOrders} paid order`} />
        <MetricCard icon={GraduationCap} label="Enrollments" value={summary.activeEnrollments} detail={`${summary.completedEnrollments} completed`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardDescription>Conversion</CardDescription>
            <CardTitle className="text-lg">Platform Funnel</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FunnelItem label="Product click ke paid order" value={summary.clickToPurchaseRate} />
            <FunnelItem label="Checkout started ke paid order" value={summary.checkoutToPurchaseRate} />
            <FunnelItem label="Course completion" value={summary.courseCompletionRate} />
            <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground sm:grid-cols-2">
              <MiniStat icon={MousePointerClick} label="Page views" value={summary.pageViews} />
              <MiniStat icon={MousePointerClick} label="Product clicks" value={summary.productClicks} />
              <MiniStat icon={CreditCard} label="Checkout" value={summary.checkoutStarted} />
              <MiniStat icon={BookOpenCheck} label="Quiz avg" value={summary.averageQuizScore} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Creators</CardDescription>
            <CardTitle className="text-lg">Active Creator Base</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-md border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Active creators</p>
              <p className="mt-2 text-3xl font-semibold">{summary.activeCreators}</p>
            </div>
            <div className="rounded-md border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Failed transactions</p>
              <p className="mt-2 text-3xl font-semibold">{summary.failedTransactions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminStatisticsCharts statistics={statistics} />

      <div className="grid gap-4 xl:grid-cols-2">
        <RankingCard title="Top Products" description="Berdasarkan revenue order paid">
          {topProducts.length === 0 ? (
            <EmptyState />
          ) : (
            topProducts.map((product) => (
              <RankingRow
                key={product.id}
                title={product.title}
                subtitle={`${product.owner} / ${product.slug}`}
                badge={product.type}
                value={formatPrice(product.revenue, product.currency)}
                detail={`${product.orders} order`}
              />
            ))
          )}
        </RankingCard>

        <RankingCard title="Top Creators" description="Berdasarkan revenue lintas produk">
          {topCreators.length === 0 ? (
            <EmptyState />
          ) : (
            topCreators.map((creator) => (
              <RankingRow
                key={creator.id}
                title={creator.name}
                subtitle={creator.username !== "-" ? `@${creator.username}` : creator.email}
                badge="Creator"
                value={formatPrice(creator.revenue, "IDR")}
                detail={`${creator.orders} order`}
              />
            ))
          )}
        </RankingCard>
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

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function RankingCard({ title, description, children }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">{children}</CardContent>
    </Card>
  );
}

function RankingRow({ title, subtitle, badge, value, detail }) {
  return (
    <article className="grid gap-3 rounded-md border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{badge}</Badge>
          <h2 className="truncate font-semibold">{title}</h2>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="sm:text-right">
        <p className="font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </article>
  );
}

function EmptyState() {
  return <p className="text-sm text-muted-foreground">Belum ada data paid order.</p>;
}

function formatPrice(price, currency) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}
