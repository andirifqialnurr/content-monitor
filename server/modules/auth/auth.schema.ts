import { z } from "zod";

export const emailSchema = z.string().trim().email().toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(128, "Password maksimal 128 karakter.");

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username minimal 3 karakter.")
  .max(32, "Username maksimal 32 karakter.")
  .regex(/^[a-z0-9-]+$/, "Username hanya boleh memakai huruf kecil, angka, dan tanda hubung.");

export const registerInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const forgotPasswordInputSchema = z.object({
  email: emailSchema,
});

export const resetPasswordInputSchema = z.object({
  token: z.string().trim().min(32, "Token reset tidak valid."),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
