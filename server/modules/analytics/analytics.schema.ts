import { z } from "zod";

export const publicAnalyticsEventTypeSchema = z.enum(["PAGE_VIEW", "LINK_CLICK", "PRODUCT_CLICK"]);

const analyticsTargetIdSchema = z.string().trim().min(1).max(128);

export const trackPublicAnalyticsInputSchema = z
  .object({
    type: publicAnalyticsEventTypeSchema,
    productId: analyticsTargetIdSchema.optional(),
    publicPageId: analyticsTargetIdSchema.optional(),
    blockId: analyticsTargetIdSchema.optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((value) => value.productId || value.publicPageId || value.blockId, {
    message: "Tracking membutuhkan productId, publicPageId, atau blockId.",
  });

export type TrackPublicAnalyticsInput = z.infer<typeof trackPublicAnalyticsInputSchema>;
