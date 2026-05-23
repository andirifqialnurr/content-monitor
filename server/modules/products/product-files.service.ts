import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { findPaidProductOrder, findProductById, updateProduct } from "@/server/modules/products/products.repository";
import {
  isPrivateFileUrl,
  readPrivateFile,
  replacePrivateEbookFile,
  type ReadPrivateFileResult,
} from "@/server/modules/storage/private-file-storage";

type EbookFileAccessResult =
  | {
      kind: "file";
      file: ReadPrivateFileResult;
    }
  | {
      kind: "redirect";
      url: string;
    };

export async function uploadEbookFile(prisma: PrismaClient, userId: string, productId: string, file: File) {
  const product = await getEbookProduct(prisma, productId);

  if (product.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Anda tidak punya akses upload ke produk ini.",
    });
  }

  const storedFile = await replacePrivateEbookFile(file, {
    userId: product.userId,
    productId: product.id,
  });

  await updateProduct(prisma, {
    id: product.id,
    fileUrl: storedFile.privateUrl,
  });

  return {
    fileName: storedFile.fileName,
    fileUrl: `/api/products/${product.id}/ebook-file`,
    mimeType: storedFile.mimeType,
    size: storedFile.size,
  };
}

export async function getEbookFileAccess(
  prisma: PrismaClient,
  userId: string,
  productId: string,
): Promise<EbookFileAccessResult> {
  const product = await getEbookProduct(prisma, productId);

  if (!product.fileUrl) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "File e-book belum tersedia.",
    });
  }

  if (product.userId !== userId) {
    const paidOrder = await findPaidProductOrder(prisma, {
      buyerUserId: userId,
      productId: product.id,
    });

    if (!paidOrder) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Order paid dibutuhkan untuk membuka file e-book ini.",
      });
    }
  }

  if (!isPrivateFileUrl(product.fileUrl)) {
    return {
      kind: "redirect",
      url: product.fileUrl,
    };
  }

  return {
    kind: "file",
    file: await readPrivateFile(product.fileUrl, {
      userId: product.userId,
      productId: product.id,
    }),
  };
}

async function getEbookProduct(prisma: PrismaClient, productId: string) {
  const product = await findProductById(prisma, productId);

  if (!product) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Produk tidak ditemukan.",
    });
  }

  if (product.type !== "EBOOK") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "File endpoint ini hanya untuk produk e-book.",
    });
  }

  return product;
}
