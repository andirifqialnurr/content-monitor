import type { BlockType, Prisma, PrismaClient } from "@prisma/client";

type CreatePageBlockParams = {
  publicPageId: string;
  type: BlockType;
  title: string;
  url?: string | null;
  productId?: string | null;
  contentItemId?: string | null;
  order: number;
  isVisible: boolean;
};

type UpdatePageBlockParams = {
  id: string;
  type?: BlockType;
  title?: string;
  url?: string | null;
  productId?: string | null;
  contentItemId?: string | null;
  isVisible?: boolean;
};

export const appearancePageInclude = {
  blocks: {
    orderBy: { order: "asc" },
    include: {
      product: true,
      contentItem: true,
    },
  },
} satisfies Prisma.PublicPageInclude;

export function findUserForAppearance(prisma: PrismaClient, userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bio: true,
      publicPage: {
        include: appearancePageInclude,
      },
    },
  });
}

export function createDefaultPublicPage(prisma: PrismaClient, user: { id: string; name?: string | null; username: string; bio?: string | null }) {
  return prisma.publicPage.create({
    data: {
      userId: user.id,
      username: user.username,
      displayName: user.name ?? user.username,
      bio: user.bio,
      themeJson: JSON.stringify({
        backgroundColor: "#f8fafc",
        textColor: "#0f172a",
        buttonStyle: "SOLID",
      }),
    },
    include: appearancePageInclude,
  });
}

export function findPublicPageByUserId(prisma: PrismaClient, userId: string) {
  return prisma.publicPage.findUnique({
    where: { userId },
    include: appearancePageInclude,
  });
}

export function updatePublicPageByUserId(
  prisma: PrismaClient,
  userId: string,
  data: {
    displayName: string;
    bio?: string | null;
    isPublished: boolean;
    themeJson: string;
  },
) {
  return prisma.publicPage.update({
    where: { userId },
    data,
    include: appearancePageInclude,
  });
}

export function listAppearanceProducts(prisma: PrismaClient, userId: string) {
  return prisma.product.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      type: true,
      slug: true,
      status: true,
      price: true,
      currency: true,
    },
  });
}

export function listAppearanceContentItems(prisma: PrismaClient, userId: string) {
  return prisma.contentItem.findMany({
    where: {
      userId,
      status: { not: "ARCHIVED" },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      type: true,
      slug: true,
      status: true,
    },
  });
}

export function findProductOwnedByUser(prisma: PrismaClient, userId: string, productId: string) {
  return prisma.product.findFirst({
    where: { id: productId, userId },
    select: { id: true },
  });
}

export function findContentItemOwnedByUser(prisma: PrismaClient, userId: string, contentItemId: string) {
  return prisma.contentItem.findFirst({
    where: { id: contentItemId, userId },
    select: { id: true },
  });
}

export function findPageBlockById(prisma: PrismaClient, id: string) {
  return prisma.publicPageBlock.findUnique({
    where: { id },
    include: {
      publicPage: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });
}

export function getNextBlockOrder(prisma: PrismaClient, publicPageId: string) {
  return prisma.publicPageBlock
    .aggregate({
      where: { publicPageId },
      _max: { order: true },
    })
    .then((result) => (result._max.order ?? -1) + 1);
}

export function createPageBlock(prisma: PrismaClient, params: CreatePageBlockParams) {
  return prisma.publicPageBlock.create({
    data: params,
  });
}

export function updatePageBlock(prisma: PrismaClient, params: UpdatePageBlockParams) {
  const { id, ...data } = params;

  return prisma.publicPageBlock.update({
    where: { id },
    data,
  });
}

export function deletePageBlock(prisma: PrismaClient, id: string) {
  return prisma.publicPageBlock.delete({
    where: { id },
  });
}

export function listSiblingBlocks(prisma: PrismaClient, publicPageId: string) {
  return prisma.publicPageBlock.findMany({
    where: { publicPageId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      order: true,
    },
  });
}

export function swapBlockOrders(
  prisma: PrismaClient,
  current: { id: string; order: number },
  target: { id: string; order: number },
) {
  const tempOrder = Math.min(current.order, target.order, 0) - 1;

  return prisma.$transaction(async (tx) => {
    await tx.publicPageBlock.update({ where: { id: current.id }, data: { order: tempOrder } });
    await tx.publicPageBlock.update({ where: { id: target.id }, data: { order: current.order } });
    return tx.publicPageBlock.update({ where: { id: current.id }, data: { order: target.order } });
  });
}
