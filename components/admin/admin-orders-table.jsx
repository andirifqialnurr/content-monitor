import { ReceiptText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminStatusBadge,
  formatDateTime,
  formatPerson,
  formatPrice,
} from "@/components/admin/admin-shared";

export function AdminOrdersTable({ orders, compact = false }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Order terbaru</CardDescription>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ReceiptText className="size-4 text-muted-foreground" />
          {orders.length} Order
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada order.</p>
        ) : (
          orders.map((order) => <OrderRow key={order.id} order={order} compact={compact} />)
        )}
      </CardContent>
    </Card>
  );
}

function OrderRow({ order, compact }) {
  const latestTransaction = order.transactions?.[0];

  return (
    <article className="grid gap-3 rounded-md border bg-muted/20 p-3 xl:grid-cols-[minmax(0,1fr)_150px_150px_150px] xl:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <AdminStatusBadge status={order.status} />
          <h2 className="truncate font-semibold">{order.product.title}</h2>
          <span className="text-xs text-muted-foreground">#{order.id}</span>
        </div>
        <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
          <span>Buyer: {formatPerson(order.buyer, order.buyerEmail)}</span>
          <span>Creator: {formatPerson(order.creator)}</span>
          {!compact && <span>Product: {order.product.type} / {order.product.status}</span>}
          {!compact && <span>Created: {formatDateTime(order.createdAt)}</span>}
        </div>
      </div>

      <Summary label="Amount" value={formatPrice(order.amount, order.currency)} />
      <Summary label="Payment" value={latestTransaction?.status ?? "-"} />
      <Summary label="Enrollment" value={order.enrollment?.status ?? "-"} />
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
