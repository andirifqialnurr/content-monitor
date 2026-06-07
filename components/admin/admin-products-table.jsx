import { Box } from "lucide-react";
import { ProductModerationControl } from "@/components/admin/admin-moderation-controls";
import {
  AdminStatusBadge,
  formatDateTime,
  formatPerson,
  formatPrice,
} from "@/components/admin/admin-shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminProductsTable({ products }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Produk lintas user</CardDescription>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Box className="size-4 text-muted-foreground" />
          {products.length} Produk
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada produk.</p>
        ) : (
          products.map((product) => <ProductRow key={product.id} product={product} />)
        )}
      </CardContent>
    </Card>
  );
}

function ProductRow({ product }) {
  return (
    <article className="grid gap-3 rounded-md border bg-muted/20 p-3 xl:grid-cols-[minmax(0,1fr)_140px_140px_140px] xl:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <AdminStatusBadge status={product.status} />
          <AdminStatusBadge status={product.moderationStatus} />
          <h2 className="truncate font-semibold">{product.title}</h2>
          <Badge variant="outline">{product.type === "COURSE" ? "Course" : "E-book"}</Badge>
        </div>
        <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
          <span>Owner: {formatPerson(product.user)}</span>
          <span>Slug: /{product.slug}</span>
          <span>Updated: {formatDateTime(product.updatedAt)}</span>
          <span>Price: {formatPrice(product.price, product.currency)}</span>
        </div>
      </div>

      <Summary label="Orders" value={product._count.orders} />
      <Summary label="Enrollments" value={product._count.enrollments} />
      <Summary label={product.type === "COURSE" ? "Modules" : "Blocks"} value={product.type === "COURSE" ? product._count.modules : product._count.pageBlocks} />
      <div className="xl:col-span-4">
        <ProductModerationControl productId={product.id} moderationStatus={product.moderationStatus} />
      </div>
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
