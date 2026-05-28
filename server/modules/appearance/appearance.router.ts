import {
  createAppearanceBlockInputSchema,
  deleteAppearanceBlockInputSchema,
  moveAppearanceBlockInputSchema,
  updateAppearanceBlockInputSchema,
  updateAppearancePageInputSchema,
} from "@/server/modules/appearance/appearance.schema";
import {
  addAppearanceBlock,
  editAppearanceBlock,
  editAppearancePage,
  getAppearance,
  moveAppearanceBlock,
  removeAppearanceBlock,
} from "@/server/modules/appearance/appearance.service";
import { createTRPCRouter } from "@/server/trpc/root";
import { protectedProcedure } from "@/server/trpc/procedures";

export const appearanceRouter = createTRPCRouter({
  get: protectedProcedure.query(({ ctx }) => getAppearance(ctx.prisma, ctx.user.id)),
  updatePage: protectedProcedure.input(updateAppearancePageInputSchema).mutation(({ ctx, input }) =>
    editAppearancePage(ctx.prisma, ctx.user.id, input),
  ),
  createBlock: protectedProcedure.input(createAppearanceBlockInputSchema).mutation(({ ctx, input }) =>
    addAppearanceBlock(ctx.prisma, ctx.user.id, input),
  ),
  updateBlock: protectedProcedure.input(updateAppearanceBlockInputSchema).mutation(({ ctx, input }) =>
    editAppearanceBlock(ctx.prisma, ctx.user.id, input),
  ),
  deleteBlock: protectedProcedure.input(deleteAppearanceBlockInputSchema).mutation(({ ctx, input }) =>
    removeAppearanceBlock(ctx.prisma, ctx.user.id, input),
  ),
  moveBlock: protectedProcedure.input(moveAppearanceBlockInputSchema).mutation(({ ctx, input }) =>
    moveAppearanceBlock(ctx.prisma, ctx.user.id, input),
  ),
});
