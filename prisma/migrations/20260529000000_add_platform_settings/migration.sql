-- Add singleton platform settings for global operational configuration.
CREATE TABLE "PlatformSettings" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'platform',
  "paymentProvider" TEXT NOT NULL DEFAULT 'MIDTRANS',
  "paymentMode" TEXT NOT NULL DEFAULT 'DISABLED',
  "platformFeePercent" INTEGER NOT NULL DEFAULT 0,
  "maxUploadMb" INTEGER NOT NULL DEFAULT 25,
  "allowedMimeTypesJson" TEXT NOT NULL DEFAULT '[]',
  "publicCheckoutEnabled" BOOLEAN NOT NULL DEFAULT false,
  "learnerAccessEnabled" BOOLEAN NOT NULL DEFAULT true,
  "analyticsTrackingEnabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedByUserId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
