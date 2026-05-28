import { z } from "zod";

export const publicAnalyticsEventTypeSchema = z.enum(["PAGE_VIEW", "LINK_CLICK", "PRODUCT_CLICK"]);

export const trackPublicAnalyticsInputSchema = z
  .object({
    type: publicAnalyticsEventTypeSchema,
    productId: z.string().cuid().optional(),
    publicPageId: z.string().cuid().optional(),
    blockId: z.string().cuid().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((value) => value.productId || value.publicPageId || value.blockId, {
    message: "Tracking membutuhkan productId, publicPageId, atau blockId.",
  });

export type TrackPublicAnalyticsInput = z.infer<typeof trackPublicAnalyticsInputSchema>;
