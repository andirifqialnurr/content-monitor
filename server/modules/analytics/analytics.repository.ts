import type { AnalyticsEventType, PrismaClient } from "@prisma/client";

type CreateAnalyticsEventParams = {
  userId?: string | null;
  publicPageId?: string | null;
  blockId?: string | null;
  productId?: string | null;
  type: AnalyticsEventType;
  metadataJson?: string | null;
  visitorId?: string | null;
  ipHash?: string | null;
};

type CountAnalyticsEventsParams = {
  type: AnalyticsEventType;
  productId?: string | null;
  metadataContains?: string;
};

export function createAnalyticsEvent(prisma: PrismaClient, params: CreateAnalyticsEventParams) {
  return prisma.analyticsEvent.create({
    data: {
      userId: params.userId,
      publicPageId: params.publicPageId,
      blockId: params.blockId,
      productId: params.productId,
      type: params.type,
      metadataJson: params.metadataJson,
      visitorId: params.visitorId,
      ipHash: params.ipHash,
    },
  });
}

export function countAnalyticsEvents(prisma: PrismaClient, params: CountAnalyticsEventsParams) {
  return prisma.analyticsEvent.count({
    where: {
      type: params.type,
      productId: params.productId,
      metadataJson: params.metadataContains ? { contains: params.metadataContains } : undefined,
    },
  });
}

export function findTrackableProduct(prisma: PrismaClient, productId: string) {
  return prisma.product.findFirst({
    where: {
      id: productId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      userId: true,
      type: true,
      title: true,
      slug: true,
    },
  });
}

export function findTrackablePublicPage(prisma: PrismaClient, publicPageId: string) {
  return prisma.publicPage.findFirst({
    where: {
      id: publicPageId,
      isPublished: true,
    },
    select: {
      id: true,
      userId: true,
      username: true,
    },
  });
}

export function findTrackableBlock(prisma: PrismaClient, blockId: string) {
  return prisma.publicPageBlock.findFirst({
    where: {
      id: blockId,
      isVisible: true,
      publicPage: {
        isPublished: true,
      },
    },
    select: {
      id: true,
      publicPageId: true,
      productId: true,
      type: true,
      title: true,
      url: true,
      publicPage: {
        select: {
          userId: true,
        },
      },
    },
  });
}
