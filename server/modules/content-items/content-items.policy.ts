import { TRPCError } from "@trpc/server";
import type { ContentItem } from "@prisma/client";

export function assertContentItemOwner(item: ContentItem | null, userId: string) {
  if (!item) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Konten tidak ditemukan.",
    });
  }

  if (item.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Anda tidak punya akses ke konten ini.",
    });
  }

  return item;
}
