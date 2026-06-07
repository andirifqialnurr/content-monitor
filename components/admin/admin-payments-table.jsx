import { CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminStatusBadge,
  formatDateTime,
  formatPerson,
  formatPrice,
} from "@/components/admin/admin-shared";

export function AdminPaymentsTable({ payments, compact = false }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Transaksi payment terbaru</CardDescription>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="size-4 text-muted-foreground" />
          {payments.length} Transaksi
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada transaksi payment.</p>
        ) : (
          payments.map((payment) => <PaymentRow key={payment.id} payment={payment} compact={compact} />)
        )}
      </CardContent>
    </Card>
  );
}

function PaymentRow({ payment, compact }) {
  return (
    <article className="grid gap-3 rounded-md border bg-muted/20 p-3 xl:grid-cols-[minmax(0,1fr)_150px_150px_170px] xl:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <AdminStatusBadge status={payment.status} />
          <h2 className="truncate font-semibold">{payment.order.product.title}</h2>
          <span className="text-xs text-muted-foreground">#{payment.orderId}</span>
        </div>
        <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
          <span>Buyer: {formatPerson(payment.order.buyer, payment.order.buyerEmail)}</span>
          <span>Creator: {formatPerson(payment.order.creator)}</span>
          {!compact && <span>Created: {formatDateTime(payment.createdAt)}</span>}
          {!compact && <span>Reference: {payment.providerReference ?? "-"}</span>}
        </div>
      </div>

      <Summary label="Provider" value={payment.provider} />
      <Summary label="Order" value={payment.order.status} />
      <Summary label="Amount" value={formatPrice(payment.order.amount, payment.order.currency)} />
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
