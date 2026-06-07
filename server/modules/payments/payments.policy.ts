import type { Product, User } from "@prisma/client";
import { TRPCError } from "@trpc/server";

type CheckoutProduct = Product & {
  user: Pick<User, "id" | "name" | "username" | "email">;
};

export function assertCheckoutProduct(product: CheckoutProduct | null, buyerUserId: string) {
  if (!product) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Produk tidak ditemukan.",
    });
  }

  if (product.status !== "ACTIVE") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Produk belum aktif untuk checkout.",
    });
  }

  if (product.moderationStatus === "DISABLED") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Produk tidak tersedia untuk checkout.",
    });
  }

  if (product.userId === buyerUserId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Anda tidak bisa membeli produk milik sendiri.",
    });
  }

  if (product.price <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Checkout payment hanya tersedia untuk produk berbayar.",
    });
  }

  return product;
}

export function assertCheckoutBuyerEmail(email: string | null | undefined) {
  if (!email) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Email akun dibutuhkan untuk checkout.",
    });
  }

  return email;
}
