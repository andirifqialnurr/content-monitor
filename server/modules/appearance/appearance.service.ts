import type { BlockType, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  createDefaultPublicPage,
  createPageBlock,
  deletePageBlock,
  findContentItemOwnedByUser,
  findPageBlockById,
  findProductOwnedByUser,
  findPublicPageByUserId,
  findUserForAppearance,
  getNextBlockOrder,
  listAppearanceContentItems,
  listAppearanceProducts,
  listSiblingBlocks,
  swapBlockOrders,
  updatePageBlock,
  updatePublicPageByUserId,
} from "@/server/modules/appearance/appearance.repository";
import {
  assertBlockOwner,
  assertPublicPageOwner,
} from "@/server/modules/appearance/appearance.policy";
import type {
  CreateAppearanceBlockInput,
  DeleteAppearanceBlockInput,
  MoveAppearanceBlockInput,
  UpdateAppearanceBlockInput,
  UpdateAppearancePageInput,
} from "@/server/modules/appearance/appearance.schema";

export async function getAppearance(prisma: PrismaClient, userId: string) {
  const publicPage = await ensurePublicPage(prisma, userId);
  const [products, contentItems, user] = await Promise.all([
    listAppearanceProducts(prisma, userId),
    listAppearanceContentItems(prisma, userId),
    findUserForAppearance(prisma, userId),
  ]);

  return {
    user,
    publicPage,
    products,
    contentItems,
  };
}

export async function editAppearancePage(
  prisma: PrismaClient,
  userId: string,
  input: UpdateAppearancePageInput,
) {
  await ensurePublicPage(prisma, userId);

  return updatePublicPageByUserId(prisma, userId, {
    displayName: input.displayName,
    bio: input.bio,
    isPublished: input.isPublished,
    themeJson: JSON.stringify(input.theme),
  });
}

export async function addAppearanceBlock(
  prisma: PrismaClient,
  userId: string,
  input: CreateAppearanceBlockInput,
) {
  const publicPage = await ensurePublicPage(prisma, userId);
  await assertTargetOwnership(prisma, userId, input);
  const order = await getNextBlockOrder(prisma, publicPage.id);

  return createPageBlock(prisma, {
    publicPageId: publicPage.id,
    type: input.type,
    title: input.title,
    url: normalizeBlockUrl(input.type, input.url),
    productId: input.type === "PRODUCT" ? input.productId : null,
    contentItemId: input.type === "CONTENT" ? input.contentItemId : null,
    order,
    isVisible: input.isVisible,
  });
}

export async function editAppearanceBlock(
  prisma: PrismaClient,
  userId: string,
  input: UpdateAppearanceBlockInput,
) {
  const block = assertBlockOwner(await findPageBlockById(prisma, input.id), userId);

  const nextType = input.type ?? block.type;
  const nextProductId = nextType === "PRODUCT" ? input.productId ?? block.productId : null;
  const nextContentItemId = nextType === "CONTENT" ? input.contentItemId ?? block.contentItemId : null;
  const nextUrl = normalizeBlockUrl(nextType, input.url ?? block.url);
  await assertTargetOwnership(prisma, userId, {
    type: nextType,
    productId: nextProductId,
    contentItemId: nextContentItemId,
  });

  return updatePageBlock(prisma, {
    id: input.id,
    type: input.type,
    title: input.title,
    url: nextUrl,
    productId: nextProductId,
    contentItemId: nextContentItemId,
    isVisible: input.isVisible,
  });
}

export async function removeAppearanceBlock(
  prisma: PrismaClient,
  userId: string,
  input: DeleteAppearanceBlockInput,
) {
  assertBlockOwner(await findPageBlockById(prisma, input.id), userId);
  await deletePageBlock(prisma, input.id);

  return { id: input.id };
}

export async function moveAppearanceBlock(
  prisma: PrismaClient,
  userId: string,
  input: MoveAppearanceBlockInput,
) {
  const block = assertBlockOwner(await findPageBlockById(prisma, input.id), userId);
  const siblings = await listSiblingBlocks(prisma, block.publicPage.id);
  const currentIndex = siblings.findIndex((item) => item.id === input.id);
  const targetIndex = input.direction === "UP" ? currentIndex - 1 : currentIndex + 1;
  const target = siblings[targetIndex];

  if (currentIndex < 0 || !target) {
    return block;
  }

  return swapBlockOrders(prisma, siblings[currentIndex], target);
}

async function ensurePublicPage(prisma: PrismaClient, userId: string) {
  const user = await findUserForAppearance(prisma, userId);

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User tidak ditemukan.",
    });
  }

  if (user.publicPage) {
    return assertPublicPageOwner(user.publicPage, userId);
  }

  return createDefaultPublicPage(prisma, user);
}

async function assertTargetOwnership(
  prisma: PrismaClient,
  userId: string,
  input: {
    type?: BlockType;
    productId?: string | null;
    contentItemId?: string | null;
  },
) {
  if (input.type === "PRODUCT" && !input.productId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Produk wajib dipilih untuk block produk.",
    });
  }

  if (input.type === "PRODUCT" && input.productId) {
    const product = await findProductOwnedByUser(prisma, userId, input.productId);

    if (!product) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Produk tidak termasuk akun ini.",
      });
    }
  }

  if (input.type === "CONTENT" && !input.contentItemId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Konten wajib dipilih untuk block konten.",
    });
  }

  if (input.type === "CONTENT" && input.contentItemId) {
    const contentItem = await findContentItemOwnedByUser(prisma, userId, input.contentItemId);

    if (!contentItem) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Konten tidak termasuk akun ini.",
      });
    }
  }
}

function normalizeBlockUrl(type: BlockType, url?: string | null) {
  return type === "LINK" || type === "CTA" ? url ?? null : null;
}
