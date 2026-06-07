import Link from "next/link";
import { BookOpen, ExternalLink, FileText, Search, ShoppingBag, UserCircle } from "lucide-react";
import { CheckoutButton } from "@/components/products/checkout-button";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const productTypeLabels = {
  EBOOK: "E-book",
  COURSE: "Course",
};

export function ProductMarketplace({ products, filters, checkoutAvailability }) {
  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Pembelian"
        title="Marketplace Produk"
        description="Temukan produk digital aktif dari pengguna lain, buka preview creator, lalu lanjut checkout dari halaman sales produk."
        badge={`${products.length} produk`}
      />

      <Card>
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]" method="get">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" name="q" placeholder="Cari produk atau creator..." defaultValue={filters.query} />
            </div>
            <select
              aria-label="Filter tipe produk"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={filters.type}
              name="type"
            >
              <option value="ALL">Semua tipe</option>
              <option value="EBOOK">E-book</option>
              <option value="COURSE">Course</option>
            </select>
            <Button type="submit">
              <Search className="size-4" />
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {products.length === 0 ? (
        <Card>
          <CardContent className="grid gap-2 p-6 text-sm text-muted-foreground">
            <ShoppingBag className="size-5" />
            Belum ada produk aktif dari pengguna lain yang cocok dengan filter ini.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {products.map((product) => (
            <MarketplaceProductCard
              key={product.id}
              checkoutAvailability={checkoutAvailability}
              product={product}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MarketplaceProductCard({ product, checkoutAvailability }) {
  const isCourse = product.type === "COURSE";
  const ProductIcon = isCourse ? BookOpen : FileText;
  const previewHref = getPreviewHref(product);

  return (
    <article>
      <Card className="h-full overflow-hidden">
        {product.coverUrl && (
          <div className="aspect-[16/7] bg-muted">
            <img src={product.coverUrl} alt={product.title} className="h-full w-full object-cover" />
          </div>
        )}
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <ProductIcon className="mr-1 size-3" />
              {productTypeLabels[product.type] ?? product.type}
            </Badge>
            <Badge variant="outline">Aktif</Badge>
          </div>
          <CardTitle className="leading-tight">{product.title}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <UserCircle className="size-4" />
            <Link className="hover:text-foreground" href={`/${product.user.username}`}>
              {product.user.name ?? product.user.username}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {product.description && (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>{formatPrice(product.price, product.currency)}</span>
            {isCourse ? <span>{product._count.modules} module</span> : <span>File digital</span>}
            <span>{product._count.orders} order</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline">
              <Link href={previewHref}>
                <ExternalLink className="size-4" />
                Preview
              </Link>
            </Button>
            {product.price > 0 ? (
              <CheckoutButton
                productId={product.id}
                analyticsMetadata={{ productType: product.type, slug: product.slug, source: "marketplace" }}
                disabledReason={checkoutAvailability.enabled ? null : checkoutAvailability.disabledReason}
              >
                Beli
              </CheckoutButton>
            ) : (
              <Button disabled variant="outline">
                Gratis
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </article>
  );
}

function getPreviewHref(product) {
  const segment = product.type === "COURSE" ? "course" : "product";

  return `/${product.user.username}/${segment}/${product.slug}`;
}

function formatPrice(price, currency) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}
