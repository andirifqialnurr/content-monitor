import type { PlatformSettings, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { createAdminAuditLog } from "@/server/modules/admin/admin.repository";
import {
  DEFAULT_ALLOWED_MIME_TYPES,
  getOrCreatePlatformSettings,
  updatePlatformSettingsRecord,
} from "@/server/modules/platform-settings/platform-settings.repository";
import type { UpdatePlatformSettingsInput } from "@/server/modules/platform-settings/platform-settings.schema";

export async function getPlatformSettings(prisma: PrismaClient) {
  const settings = await getOrCreatePlatformSettings(prisma);

  return serializePlatformSettings(settings);
}

export async function getPlatformPaymentSettings(prisma: PrismaClient) {
  const settings = await getPlatformSettings(prisma);

  return {
    paymentProvider: settings.paymentProvider,
    paymentMode: settings.paymentMode,
    publicCheckoutEnabled: settings.publicCheckoutEnabled,
  };
}

export async function isAnalyticsTrackingEnabled(prisma: PrismaClient) {
  const settings = await getPlatformSettings(prisma);

  return settings.analyticsTrackingEnabled;
}

export async function assertLearnerAccessEnabled(prisma: PrismaClient) {
  const settings = await getPlatformSettings(prisma);

  if (!settings.learnerAccessEnabled) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Learner area sedang dinonaktifkan oleh admin.",
    });
  }
}

export async function updatePlatformSettings(
  prisma: PrismaClient,
  actorUserId: string,
  input: UpdatePlatformSettingsInput,
) {
  const previous = await getPlatformSettings(prisma);
  const updated = await updatePlatformSettingsRecord(prisma, {
    ...input,
    allowedMimeTypesJson: JSON.stringify(input.allowedMimeTypes),
    updatedByUserId: actorUserId,
  });
  const next = serializePlatformSettings(updated);

  await createAdminAuditLog(prisma, {
    actorUserId,
    action: "PLATFORM_SETTINGS_UPDATED",
    metadataJson: JSON.stringify({
      previous: pickAuditSettings(previous),
      next: pickAuditSettings(next),
    }),
  });

  return next;
}

function serializePlatformSettings(settings: PlatformSettings) {
  return {
    id: settings.id,
    paymentProvider: settings.paymentProvider,
    paymentMode: settings.paymentMode,
    platformFeePercent: settings.platformFeePercent,
    maxUploadMb: settings.maxUploadMb,
    allowedMimeTypes: parseAllowedMimeTypes(settings.allowedMimeTypesJson),
    publicCheckoutEnabled: settings.publicCheckoutEnabled,
    learnerAccessEnabled: settings.learnerAccessEnabled,
    analyticsTrackingEnabled: settings.analyticsTrackingEnabled,
    updatedByUserId: settings.updatedByUserId,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
  };
}

function parseAllowedMimeTypes(value: string | null) {
  try {
    const parsed = JSON.parse(value ?? "[]");

    if (Array.isArray(parsed)) {
      const mimeTypes = parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      return mimeTypes.length > 0 ? mimeTypes : DEFAULT_ALLOWED_MIME_TYPES;
    }
  } catch {
    return DEFAULT_ALLOWED_MIME_TYPES;
  }

  return DEFAULT_ALLOWED_MIME_TYPES;
}

function pickAuditSettings(settings: Awaited<ReturnType<typeof getPlatformSettings>>) {
  return {
    paymentProvider: settings.paymentProvider,
    paymentMode: settings.paymentMode,
    platformFeePercent: settings.platformFeePercent,
    maxUploadMb: settings.maxUploadMb,
    allowedMimeTypes: settings.allowedMimeTypes,
    publicCheckoutEnabled: settings.publicCheckoutEnabled,
    learnerAccessEnabled: settings.learnerAccessEnabled,
    analyticsTrackingEnabled: settings.analyticsTrackingEnabled,
  };
}
