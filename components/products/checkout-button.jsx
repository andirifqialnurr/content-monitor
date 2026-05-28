"use client";

import { CreditCard } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { trackPublicAnalytics } from "@/components/analytics/public-analytics-tracker";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/react";

export function CheckoutButton({ productId, children = "Beli sekarang", className, analyticsMetadata }) {
  const pathname = usePathname();
  const router = useRouter();
  const [error, setError] = useState("");
  const checkoutMutation = trpc.payments.checkout.useMutation({
    onSuccess: (result) => {
      window.location.assign(result.checkoutUrl);
    },
    onError: (checkoutError) => {
      if (checkoutError.data?.code === "UNAUTHORIZED") {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }

      setError(checkoutError.message);
    },
  });

  function handleCheckout() {
    setError("");
    trackPublicAnalytics({
      type: "PRODUCT_CLICK",
      productId,
      metadata: {
        path: window.location.pathname,
        ...analyticsMetadata,
      },
    });
    checkoutMutation.mutate({ productId });
  }

  return (
    <div className="grid gap-2">
      <Button className={className} onClick={handleCheckout} disabled={checkoutMutation.isPending}>
        <CreditCard className="size-4" />
        {checkoutMutation.isPending ? "Membuka checkout..." : children}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
