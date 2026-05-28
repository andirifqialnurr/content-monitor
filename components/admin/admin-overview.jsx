import Link from "next/link";
import { CreditCard, ReceiptText, Users, WalletCards } from "lucide-react";
import { AdminAuditLog } from "@/components/admin/admin-audit-log";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { AdminPaymentsTable } from "@/components/admin/admin-payments-table";
import { formatPrice } from "@/components/admin/admin-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";

export function AdminOverview({ overview }) {
  const { summary } = overview;

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Admin"
        title="Platform Overview"
        description="Ringkasan operasional platform, order, payment, enrollment, dan revenue."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Users" value={summary.totalUsers} detail={`${summary.totalProducts} produk`} />
        <MetricCard icon={WalletCards} label="Revenue" value={formatPrice(summary.revenue)} detail={`${summary.paidOrders} order paid`} />
        <MetricCard icon={ReceiptText} label="Orders" value={summary.totalOrders} detail={`${summary.pendingOrders} pending`} />
        <MetricCard icon={CreditCard} label="Failed payment" value={summary.failedTransactions} detail="Butuh investigasi" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <AdminOrdersTable orders={overview.recentOrders} compact />
          <AdminPaymentsTable payments={overview.recentPayments} compact />
          <AdminAuditLog logs={overview.auditLogs} />
        </div>

        <Card>
          <CardHeader>
            <CardDescription>Health</CardDescription>
            <CardTitle className="text-lg">Platform Metrics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <RateItem label="Paid order rate" value={summary.orderPaidRate} />
            <RateItem label="Course completion" value={summary.courseCompletionRate} />
            <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
              <p>Active products: {summary.activeProducts}</p>
              <p>Active enrollments: {summary.activeEnrollments}</p>
              <p>Completed enrollments: {summary.completedEnrollments}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/orders">Lihat orders</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/payments">Lihat payments</Link>
              </Button>
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

function RateItem({ label, value }) {
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
