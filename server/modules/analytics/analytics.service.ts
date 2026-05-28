import type { AnalyticsEventType, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  countAnalyticsEvents,
  createAnalyticsEvent,
  findTrackableBlock,
  findTrackableProduct,
  findTrackablePublicPage,
} from "@/server/modules/analytics/analytics.repository";
import type { TrackPublicAnalyticsInput } from "@/server/modules/analytics/analytics.schema";

type TrackAnalyticsEventParams = {
  userId?: string | null;
  publicPageId?: string | null;
  blockId?: string | null;
  productId?: string | null;
  type: AnalyticsEventType;
  metadata?: Record<string, unknown>;
  visitorId?: string | null;
  ipHash?: string | null;
};

type PublicTrackContext = {
  visitorId?: string | null;
  ipHash?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
};

export function trackAnalyticsEvent(prisma: PrismaClient, params: TrackAnalyticsEventParams) {
  return createAnalyticsEvent(prisma, {
    userId: params.userId,
    publicPageId: params.publicPageId,
    blockId: params.blockId,
    productId: params.productId,
    type: params.type,
    metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
    visitorId: params.visitorId,
    ipHash: params.ipHash,
  });
}

export async function trackAnalyticsEventOnceByOrder(
  prisma: PrismaClient,
  params: TrackAnalyticsEventParams & { orderId: string },
) {
  const existingEvents = await countAnalyticsEvents(prisma, {
    type: params.type,
    productId: params.productId,
    metadataContains: `"orderId":"${params.orderId}"`,
  });

  if (existingEvents > 0) {
    return null;
  }

  return trackAnalyticsEvent(prisma, {
    ...params,
    metadata: {
      ...params.metadata,
      orderId: params.orderId,
    },
  });
}

export async function trackPublicAnalyticsEvent(
  prisma: PrismaClient,
  input: TrackPublicAnalyticsInput,
  context: PublicTrackContext,
) {
  const scope = await resolvePublicTrackingScope(prisma, input);

  return trackAnalyticsEvent(prisma, {
    userId: scope.userId,
    publicPageId: scope.publicPageId,
    blockId: scope.blockId,
    productId: scope.productId,
    type: input.type,
    visitorId: context.visitorId,
    ipHash: context.ipHash,
    metadata: {
      ...input.metadata,
      referrer: context.referrer,
      userAgent: context.userAgent,
    },
  });
}

async function resolvePublicTrackingScope(prisma: PrismaClient, input: TrackPublicAnalyticsInput) {
  if (input.blockId) {
    const block = await findTrackableBlock(prisma, input.blockId);

    if (!block) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Block publik tidak ditemukan.",
      });
    }

    return {
      userId: block.publicPage.userId,
      publicPageId: block.publicPageId,
      blockId: block.id,
      productId: block.productId,
    };
  }

  if (input.productId) {
    const product = await findTrackableProduct(prisma, input.productId);

    if (!product) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Produk publik tidak ditemukan.",
      });
    }

    return {
      userId: product.userId,
      publicPageId: input.publicPageId ?? null,
      blockId: null,
      productId: product.id,
    };
  }

  if (input.publicPageId) {
    const publicPage = await findTrackablePublicPage(prisma, input.publicPageId);

    if (!publicPage) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Halaman publik tidak ditemukan.",
      });
    }

    return {
      userId: publicPage.userId,
      publicPageId: publicPage.id,
      blockId: null,
      productId: null,
    };
  }

  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Target tracking tidak valid.",
  });
}
