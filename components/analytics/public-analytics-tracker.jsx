"use client";

import { useEffect, useRef } from "react";

export function PublicAnalyticsTracker({ productId, publicPageId, blockId, type = "PAGE_VIEW", metadata }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) {
      return;
    }

    trackedRef.current = true;
    trackPublicAnalytics({
      type,
      productId,
      publicPageId,
      blockId,
      metadata: {
        path: window.location.pathname,
        ...metadata,
      },
    });
  }, [blockId, metadata, productId, publicPageId, type]);

  return null;
}

export function trackPublicAnalytics(payload) {
  return fetch("/api/analytics/track", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => null);
}
