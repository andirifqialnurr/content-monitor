import { TRPCError } from "@trpc/server";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function assertRateLimit(options: RateLimitOptions) {
  const now = Date.now();
  const bucket = buckets.get(options.key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(options.key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return;
  }

  if (bucket.count >= options.limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: options.message ?? "Terlalu banyak request. Coba lagi nanti.",
    });
  }

  bucket.count += 1;
}
