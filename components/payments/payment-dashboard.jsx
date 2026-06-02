"use client";

import Link from "next/link";
import { BookOpen, CreditCard, Download, ExternalLink, ReceiptText, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/react";

const statusLabels = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  EXPIRED: "Expired",
  REFUNDED: "Refunded",
};

export function PaymentDashboard() {
  const dashboard = trpc.payments.dashboard.useQuery();

  if (dashboard.isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat payment...</p>;
  }

  if (dashboard.error) {
    return <p className="text-sm text-destructive">{dashboard.error.message}</p>;
  }

  const data = dashboard.data;

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Checkout"
        title="Payment"
        description="Pantau order penjualan, pembelian, status transaksi, dan akses setelah pembayaran."
        badge={`${data.sales.summary.total + data.purchases.summary.total} order`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={TrendingUp}
          title="Revenue paid"
          value={formatPrice(data.sales.summary.revenue, "IDR")}
          detail={`${data.sales.summary.paid} order paid`}
        />
        <SummaryCard
          icon={ReceiptText}
          title="Sales pending"
          value={data.sales.summary.pending}
          detail={`${data.sales.summary.total} total penjualan`}
        />
        <SummaryCard
          icon={CreditCard}
          title="Purchase paid"
          value={data.purchases.summary.paid}
          detail={`${data.purchases.summary.total} total pembelian`}
        />
        <SummaryCard
          icon={BookOpen}
          title="Need attention"
          value={data.sales.summary.failed + data.sales.summary.expired + data.purchases.summary.failed + data.purchases.summary.expired}
          detail="Failed atau expired"
        />
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Penjualan</TabsTrigger>
          <TabsTrigger value="purchases">Pembelian</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          <OrderList mode="sales" orders={data.sales.orders} />
        </TabsContent>
        <TabsContent value="purchases">
          <OrderList mode="purchases" orders={data.purchases.orders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value, detail }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
          <Icon className="size-4" />
          {title}
        </CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{detail}</CardContent>
    </Card>
  );
}

function OrderList({ mode, orders }) {
  if (!orders.length) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Belum ada {mode === "sales" ? "order penjualan" : "order pembelian"}.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {orders.map((order) => (
        <article key={order.id}>
          <Card>
            <CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant={getStatusVariant(order.status)}>{statusLabels[order.status] ?? order.status}</Badge>
                  <Badge variant="outline">{order.product.type}</Badge>
                  {order.transactions[0]?.provider && <Badge variant="outline">{order.transactions[0].provider}</Badge>}
                </div>
                <h3 className="truncate font-semibold">{order.product.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {mode === "sales" ? buyerLabel(order) : creatorLabel(order)} / {formatDate(order.createdAt)}
                </p>
                <p className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
              </div>

              <div className="grid gap-2 lg:justify-items-end">
                <p className="text-lg font-semibold">{formatPrice(order.amount, order.currency)}</p>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/payment/orders/${order.id}`}>
                      <ExternalLink className="size-4" />
                      Detail
                    </Link>
                  </Button>
                  {mode === "purchases" && order.status === "PAID" && <PaidPurchaseAction order={order} />}
                </div>
              </div>
            </CardContent>
          </Card>
        </article>
      ))}
    </div>
  );
}

function PaidPurchaseAction({ order }) {
  if (order.product.type === "EBOOK") {
    return (
      <Button asChild variant="outline" size="sm">
        <a href={`/api/products/${order.product.id}/ebook-file?download=1`} target="_blank" rel="noreferrer">
          <Download className="size-4" />
          Download
        </a>
      </Button>
    );
  }

  return (
    <Button asChild variant="outline" size="sm">
      <Link href={`/learn/${order.product.slug}`}>
        <BookOpen className="size-4" />
        Buka course
      </Link>
    </Button>
  );
}

function buyerLabel(order) {
  return order.buyer?.name ?? order.buyer?.email ?? order.buyerEmail;
}

function creatorLabel(order) {
  return order.creator.name ?? order.creator.email ?? order.creator.username;
}

function getStatusVariant(status) {
  if (status === "PAID") {
    return "secondary";
  }

  if (status === "FAILED" || status === "EXPIRED") {
    return "destructive";
  }

  return "outline";
}

function formatPrice(price, currency) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
