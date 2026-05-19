import { TRPCError } from "@trpc/server";
import { publicProcedure } from "@/server/trpc/root";

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Login dibutuhkan untuk mengakses resource ini.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Akses admin dibutuhkan.",
    });
  }

  return next({ ctx });
});
