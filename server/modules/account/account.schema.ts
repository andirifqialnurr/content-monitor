import { z } from "zod";
import { passwordSchema, usernameSchema } from "@/server/modules/auth/auth.schema";

const optionalTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null);

export const updateAccountProfileInputSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80),
  username: usernameSchema,
  bio: optionalTextSchema(280),
  avatarUrl: optionalTextSchema(500),
  timezone: z.string().trim().min(3, "Timezone minimal 3 karakter.").max(80),
});

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
  newPassword: passwordSchema,
});

export type UpdateAccountProfileInput = z.infer<typeof updateAccountProfileInputSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
