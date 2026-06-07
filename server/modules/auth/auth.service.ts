import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { hashPassword, verifyPassword } from "@/server/shared/password";
import {
  createPasswordResetToken,
  createUser,
  deleteExpiredPasswordResetTokens,
  findUsablePasswordResetToken,
  findUserByEmail,
  findUserByUsername,
  resetUserPassword,
  toSessionUser,
} from "@/server/modules/auth/auth.repository";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@/server/modules/auth/auth.schema";
import { sendEmail } from "@/server/shared/email";
import { assertRateLimit } from "@/server/shared/rate-limit";

const authRateLimitWindowMs = 15 * 60 * 1000;
const resetTokenExpiryMs = 60 * 60 * 1000;

export async function registerUser(prisma: PrismaClient, input: RegisterInput) {
  assertRateLimit({
    key: `register:${input.email.toLowerCase()}:${input.username.toLowerCase()}`,
    limit: 5,
    windowMs: authRateLimitWindowMs,
    message: "Terlalu banyak percobaan register. Coba lagi nanti.",
  });

  const [emailUser, usernameUser] = await Promise.all([
    findUserByEmail(prisma, input.email),
    findUserByUsername(prisma, input.username),
  ]);

  if (emailUser) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Email sudah terdaftar.",
    });
  }

  if (usernameUser) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Username sudah dipakai.",
    });
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser(prisma, {
    name: input.name,
    email: input.email,
    username: input.username,
    passwordHash,
  });

  return toSessionUser(user);
}

export async function authenticateUser(prisma: PrismaClient, input: LoginInput) {
  assertRateLimit({
    key: `login:${input.email.toLowerCase()}`,
    limit: 10,
    windowMs: authRateLimitWindowMs,
    message: "Terlalu banyak percobaan login. Coba lagi nanti.",
  });

  const user = await findUserByEmail(prisma, input.email);

  if (!user?.passwordHash) {
    return null;
  }

  if (user.status !== "ACTIVE") {
    return null;
  }

  const valid = await verifyPassword(input.password, user.passwordHash);

  if (!valid) {
    return null;
  }

  return toSessionUser(user);
}

export async function requestPasswordReset(prisma: PrismaClient, input: ForgotPasswordInput) {
  assertRateLimit({
    key: `forgot-password:${input.email.toLowerCase()}`,
    limit: 5,
    windowMs: authRateLimitWindowMs,
    message: "Terlalu banyak percobaan reset password. Coba lagi nanti.",
  });

  const user = await findUserByEmail(prisma, input.email);
  let resetUrl: string | null = null;

  await deleteExpiredPasswordResetTokens(prisma, new Date()).catch(() => null);

  if (user?.status === "ACTIVE" && user.passwordHash) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + resetTokenExpiryMs);
    await createPasswordResetToken(prisma, user.id, tokenHash, expiresAt);
    const passwordResetUrl = `${getAppBaseUrl()}/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, passwordResetUrl).catch((error) => {
      console.error("Password reset email failed.", error);
    });

    if (shouldExposeDevelopmentResetLink()) {
      resetUrl = passwordResetUrl;
    }
  }

  return {
    ok: true,
    resetUrl,
  };
}

export async function resetPassword(prisma: PrismaClient, input: ResetPasswordInput) {
  assertRateLimit({
    key: `reset-password:${hashResetToken(input.token)}`,
    limit: 8,
    windowMs: authRateLimitWindowMs,
    message: "Terlalu banyak percobaan reset password. Coba lagi nanti.",
  });

  const now = new Date();
  const resetToken = await findUsablePasswordResetToken(prisma, hashResetToken(input.token), now);

  if (!resetToken) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Token reset tidak valid atau sudah kedaluwarsa.",
    });
  }

  const passwordHash = await hashPassword(input.password);
  await resetUserPassword(prisma, resetToken.id, resetToken.userId, passwordHash);

  return { ok: true };
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getAppBaseUrl() {
  return (process.env.NEXTAUTH_URL ?? "http://127.0.0.1:4000").replace(/\/+$/, "");
}

function shouldExposeDevelopmentResetLink() {
  return process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_RESET_LINKS !== "false";
}

async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await sendEmail({
    to: email,
    subject: "Reset password Content Monitor",
    text: [
      "Gunakan link berikut untuk reset password Content Monitor:",
      resetUrl,
      "",
      "Link ini berlaku selama 60 menit. Abaikan email ini jika Anda tidak meminta reset password.",
    ].join("\n"),
    html: [
      "<p>Gunakan link berikut untuk reset password Content Monitor:</p>",
      `<p><a href="${escapeHtml(resetUrl)}">Reset password</a></p>`,
      "<p>Link ini berlaku selama 60 menit. Abaikan email ini jika Anda tidak meminta reset password.</p>",
    ].join(""),
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
