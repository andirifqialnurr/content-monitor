"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { trackPublicAnalytics } from "@/components/analytics/public-analytics-tracker";
import { Badge } from "@/components/ui/badge";

export function PublicPageBlockLink({ block, href, children, buttonStyle = "SOLID" }) {
  const isExternal = href.startsWith("http://") || href.startsWith("https://");

  function handleClick() {
    trackPublicAnalytics({
      type: block.type === "PRODUCT" ? "PRODUCT_CLICK" : "LINK_CLICK",
      blockId: block.id,
      metadata: {
        path: window.location.pathname,
        blockType: block.type,
        title: block.title,
      },
    });
  }

  const content = (
    <span className={getPublicButtonClass(buttonStyle)}>
      <span className="min-w-0">
        <span className="block truncate font-medium">{children}</span>
        <span className="mt-1 flex flex-wrap gap-2">
          <Badge variant="outline">{formatBlockType(block.type)}</Badge>
        </span>
      </span>
      <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
    </span>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" onClick={handleClick}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} onClick={handleClick}>
      {content}
    </Link>
  );
}

function getPublicButtonClass(buttonStyle) {
  const base = "flex min-h-14 w-full items-center justify-between gap-3 rounded-md px-4 py-3 text-left shadow-sm transition";

  if (buttonStyle === "OUTLINE") {
    return `${base} border border-current bg-transparent hover:bg-background/30`;
  }

  if (buttonStyle === "SOFT") {
    return `${base} border border-transparent bg-background/55 hover:bg-background/75`;
  }

  return `${base} border border-transparent bg-card text-card-foreground hover:bg-muted/80`;
}

function formatBlockType(type) {
  if (type === "PRODUCT") {
    return "Produk";
  }

  if (type === "CONTENT") {
    return "Konten";
  }

  return type;
}
