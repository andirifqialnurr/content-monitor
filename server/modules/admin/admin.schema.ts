import { z } from "zod";

const adminEntityIdSchema = z.string().trim().min(1).max(128);

export const updateAdminUserStatusInputSchema = z.object({
  id: adminEntityIdSchema,
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const updateAdminProductModerationInputSchema = z.object({
  id: adminEntityIdSchema,
  moderationStatus: z.enum(["APPROVED", "REVIEW_REQUIRED", "DISABLED"]),
});

export type UpdateAdminUserStatusInput = z.infer<typeof updateAdminUserStatusInputSchema>;
export type UpdateAdminProductModerationInput = z.infer<typeof updateAdminProductModerationInputSchema>;
