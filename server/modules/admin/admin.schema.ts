import { z } from "zod";

export const updateAdminUserStatusInputSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const updateAdminProductModerationInputSchema = z.object({
  id: z.string().cuid(),
  moderationStatus: z.enum(["APPROVED", "REVIEW_REQUIRED", "DISABLED"]),
});

export type UpdateAdminUserStatusInput = z.infer<typeof updateAdminUserStatusInputSchema>;
export type UpdateAdminProductModerationInput = z.infer<typeof updateAdminProductModerationInputSchema>;
