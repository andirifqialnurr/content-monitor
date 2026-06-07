import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  createProduct,
  deleteProduct,
  findProductById,
  findProductBySlug,
  findProductDetailById,
  listProducts,
  updateProduct,
} from "@/server/modules/products/products.repository";
import { assertProductOwner } from "@/server/modules/products/products.policy";
import type {
  CreateProductInput,
  DeleteProductInput,
  GetProductInput,
  ListProductsInput,
  UpdateProductInput,
} from "@/server/modules/products/products.schema";

export function getProducts(prisma: PrismaClient, userId: string, input: ListProductsInput) {
  return listProducts(prisma, {
    userId,
    type: input.type,
    status: input.status,
    query: input.query,
  });
}

export async function getProduct(prisma: PrismaClient, userId: string, input: GetProductInput) {
  const product = await findProductDetailById(prisma, input.id);

  return assertProductOwner(product, userId);
}

export async function addProduct(prisma: PrismaClient, userId: string, input: CreateProductInput) {
  const slug = normalizeSlug(input.slug ?? input.title);
  await assertSlugIsAvailable(prisma, userId, slug);

  return createProduct(prisma, {
    userId,
    type: input.type,
    title: input.title,
    slug,
    description: input.description,
    price: input.price,
    currency: input.currency,
    coverUrl: input.coverUrl,
    fileUrl: input.fileUrl,
    status: input.status,
  });
}

export async function editProduct(prisma: PrismaClient, userId: string, input: UpdateProductInput) {
  const product = await findProductById(prisma, input.id);
  assertProductOwner(product, userId);

  const slug = input.slug ? normalizeSlug(input.slug) : undefined;

  if (slug) {
    await assertSlugIsAvailable(prisma, userId, slug, input.id);
  }

  return updateProduct(prisma, {
    ...input,
    slug,
  });
}

export async function removeProduct(prisma: PrismaClient, userId: string, input: DeleteProductInput) {
  const product = await findProductDetailById(prisma, input.id);
  const ownedProduct = assertProductOwner(product, userId);

  if (ownedProduct._count.orders > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Produk dengan order tidak bisa dihapus. Ubah status menjadi inactive.",
    });
  }

  await deleteProduct(prisma, input.id);

  return { id: input.id };
}

async function assertSlugIsAvailable(prisma: PrismaClient, userId: string, slug: string, excludeId?: string) {
  const existingProduct = await findProductBySlug(prisma, {
    userId,
    slug,
    excludeId,
  });

  if (existingProduct) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Slug produk sudah dipakai.",
    });
  }
}

function normalizeSlug(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || `produk-${Date.now()}`;
}
