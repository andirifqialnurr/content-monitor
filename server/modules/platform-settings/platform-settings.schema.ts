import { z } from "zod";

const mimeTypeSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*(?:\+[a-z0-9][a-z0-9!#$&^_.+-]*)?$/i, {
    message: "MIME type tidak valid.",
  });

export const updatePlatformSettingsInputSchema = z.object({
  paymentProvider: z.enum(["MIDTRANS", "XENDIT"]),
  paymentMode: z.enum(["DISABLED", "SANDBOX", "PRODUCTION"]),
  platformFeePercent: z.number().int().min(0).max(100),
  maxUploadMb: z.number().int().min(1).max(2048),
  allowedMimeTypes: z
    .array(mimeTypeSchema)
    .min(1)
    .max(30)
    .transform((values) => Array.from(new Set(values.map((value) => value.toLowerCase())))),
  publicCheckoutEnabled: z.boolean(),
  learnerAccessEnabled: z.boolean(),
  analyticsTrackingEnabled: z.boolean(),
});

export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsInputSchema>;
