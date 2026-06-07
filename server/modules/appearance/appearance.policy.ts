import { TRPCError } from "@trpc/server";

type OwnedPublicPageResource = {
  userId: string;
};

type OwnedBlockResource = {
  publicPage: {
    userId: string;
  };
};

export function assertPublicPageOwner<TResource extends OwnedPublicPageResource>(
  resource: TResource | null,
  userId: string,
) {
  if (!resource) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Public page tidak ditemukan.",
    });
  }

  if (resource.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Anda tidak punya akses ke public page ini.",
    });
  }

  return resource;
}

export function assertBlockOwner<TResource extends OwnedBlockResource>(resource: TResource | null, userId: string) {
  if (!resource) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Block tidak ditemukan.",
    });
  }

  if (resource.publicPage.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Anda tidak punya akses ke block ini.",
    });
  }

  return resource;
}
