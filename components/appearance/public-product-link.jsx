"use client";

import Link from "next/link";
import { trackPublicAnalytics } from "@/components/analytics/public-analytics-tracker";
import { Badge } from "@/components/ui/badge";

export function PublicProductLink({ product, username, buttonStyle = "SOLID" }) {
  function handleClick() {
    trackPublicAnalytics({
      type: "PRODUCT_CLICK",
      productId: product.id,
      metadata: {
        path: window.location.pathname,
        productType: product.type,
        slug: product.slug,
      },
    });
  }

  return (
    <Link
      className={getPublicButtonClass(buttonStyle)}
      href={getProductHref(product, username)}
      onClick={handleClick}
    >
      <span className="min-w-0">
        <span className="block truncate font-medium">{product.title}</span>
        <span className="mt-1 flex flex-wrap gap-2">
          <Badge variant="outline">{product.type === "COURSE" ? "Course" : "E-book"}</Badge>
          <Badge variant="secondary">{formatPrice(product.price, product.currency)}</Badge>
        </span>
      </span>
    </Link>
  );
}

function getPublicButtonClass(buttonStyle) {
  const base = "flex min-h-14 items-center justify-between gap-3 rounded-md px-4 py-3 shadow-sm transition";

  if (buttonStyle === "OUTLINE") {
    return `${base} border border-current bg-transparent hover:bg-background/30`;
  }

  if (buttonStyle === "SOFT") {
    return `${base} border border-transparent bg-background/55 hover:bg-background/75`;
  }

  return `${base} border border-transparent bg-card text-card-foreground hover:bg-muted/80`;
}

function getProductHref(product, username) {
  return product.type === "COURSE"
    ? `/${username}/course/${product.slug}`
    : `/${username}/product/${product.slug}`;
}

function formatPrice(price, currency) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}
