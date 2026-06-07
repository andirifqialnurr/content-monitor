"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, Download, GraduationCap, RefreshCw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { trpc } from "@/lib/trpc/react";

const statusLabels = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  EXPIRED: "Expired",
  REFUNDED: "Refunded",
};

export function PaymentOrderStatus({ orderId }) {
  const order = trpc.payments.getOrder.useQuery(
    { orderId },
    {
      refetchInterval: 5000,
    },
  );

  if (order.isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat order...</p>;
  }

  if (order.error) {
    return <p className="text-sm text-destructive">{order.error.message}</p>;
  }

  const data = order.data;
  const latestTransaction = data.transactions[0];
  const StatusIcon = getStatusIcon(data.status);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Payment"
        title="Status Order"
        description="Status ini mengikuti update webhook provider payment. Gunakan refresh jika halaman kembali lebih cepat dari webhook."
        badge={statusLabels[data.status] ?? data.status}
      />

      <Card>
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardDescription>Order #{data.id}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-xl">
              <StatusIcon className="size-5 text-muted-foreground" />
              {data.product.title}
            </CardTitle>
          </div>
          <Badge variant={data.status === "PAID" ? "default" : "secondary"}>{statusLabels[data.status] ?? data.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryItem label="Produk" value={data.product.type === "COURSE" ? "Course" : "E-book"} />
            <SummaryItem label="Total" value={formatPrice(data.amount, data.currency)} />
            <SummaryItem label="Creator" value={data.product.user.name ?? data.product.user.username} />
          </div>

          {latestTransaction && (
            <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
              <p>Provider: {latestTransaction.provider}</p>
              <p>Status transaksi: {latestTransaction.status}</p>
              {latestTransaction.providerReference && <p>Reference: {latestTransaction.providerReference}</p>}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => order.refetch()} disabled={order.isFetching}>
              <RefreshCw className="size-4" />
              {order.isFetching ? "Memuat..." : "Refresh"}
            </Button>
            {data.status === "PAID" && data.product.type === "COURSE" && (
              <Button asChild>
                <Link href={`/learn/${data.product.slug}`}>
                  <GraduationCap className="size-4" />
                  Buka course
                </Link>
              </Button>
            )}
            {data.status === "PAID" && data.product.type === "EBOOK" && (
              <Button asChild>
                <a href={`/api/products/${data.product.id}/ebook-file?download=1`} target="_blank" rel="noreferrer">
                  <Download className="size-4" />
                  Download e-book
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function getStatusIcon(status) {
  if (status === "PAID") {
    return CheckCircle2;
  }

  if (status === "FAILED" || status === "EXPIRED" || status === "REFUNDED") {
    return XCircle;
  }

  return Clock3;
}

function formatPrice(price, currency) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}
