"use client";

import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function SessionExpiryGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (status === "loading" || redirectingRef.current) {
      return;
    }

    const expiresAt = Number(session?.sessionExpiresAt ?? 0);
    const isExpired = Boolean(expiresAt && Date.now() >= expiresAt);
    const isInvalidSession =
      status === "unauthenticated" || session?.error === "SessionExpired" || !session?.user?.id || isExpired;

    if (isInvalidSession) {
      redirectingRef.current = true;
      const callbackUrl = pathname ? `/login?callbackUrl=${encodeURIComponent(pathname)}` : "/login";

      signOut({ redirect: false }).finally(() => {
        router.replace(callbackUrl);
        router.refresh();
      });
      return;
    }

    const delay = expiresAt - Date.now();

    if (!Number.isFinite(delay) || delay <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      redirectingRef.current = true;
      const callbackUrl = pathname ? `/login?callbackUrl=${encodeURIComponent(pathname)}` : "/login";

      signOut({ redirect: false }).finally(() => {
        router.replace(callbackUrl);
        router.refresh();
      });
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, router, session, status]);

  return null;
}
