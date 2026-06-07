import { TRPCError } from "@trpc/server";
import type { Product } from "@prisma/client";

export function assertProductOwner<TProduct extends Product>(product: TProduct | null, userId: string) {
  if (!product) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Produk tidak ditemukan.",
    });
  }

  if (product.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Anda tidak punya akses ke produk ini.",
    });
  }

  return product;
}
