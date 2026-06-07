import type { PaymentProvider, PlatformPaymentMode, PrismaClient } from "@prisma/client";

export const PLATFORM_SETTINGS_ID = "platform";

export const DEFAULT_ALLOWED_MIME_TYPES = ["application/pdf"];

export type PlatformSettingsWrite = {
  paymentProvider: PaymentProvider;
  paymentMode: PlatformPaymentMode;
  platformFeePercent: number;
  maxUploadMb: number;
  allowedMimeTypesJson: string;
  publicCheckoutEnabled: boolean;
  learnerAccessEnabled: boolean;
  analyticsTrackingEnabled: boolean;
  updatedByUserId?: string | null;
};

export function getOrCreatePlatformSettings(prisma: PrismaClient) {
  return prisma.platformSettings.upsert({
    where: { id: PLATFORM_SETTINGS_ID },
    update: {},
    create: {
      id: PLATFORM_SETTINGS_ID,
      ...getDefaultPlatformSettingsData(),
    },
  });
}

export function updatePlatformSettingsRecord(prisma: PrismaClient, data: PlatformSettingsWrite) {
  return prisma.platformSettings.upsert({
    where: { id: PLATFORM_SETTINGS_ID },
    update: data,
    create: {
      id: PLATFORM_SETTINGS_ID,
      ...data,
    },
  });
}

export function getDefaultPlatformSettingsData(): PlatformSettingsWrite {
  return {
    paymentProvider: "MIDTRANS",
    paymentMode: "DISABLED",
    platformFeePercent: 0,
    maxUploadMb: 25,
    allowedMimeTypesJson: JSON.stringify(DEFAULT_ALLOWED_MIME_TYPES),
    publicCheckoutEnabled: false,
    learnerAccessEnabled: true,
    analyticsTrackingEnabled: true,
    updatedByUserId: null,
  };
}
