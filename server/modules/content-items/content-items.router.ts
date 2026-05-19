import { createTRPCRouter } from "@/server/trpc/root";
import { protectedProcedure } from "@/server/trpc/procedures";
import {
  createContentItemInputSchema,
  deleteContentItemInputSchema,
  listContentItemsInputSchema,
  updateContentItemInputSchema,
} from "@/server/modules/content-items/content-items.schema";
import {
  addContentItem,
  editContentItem,
  getContentItems,
  removeContentItem,
} from "@/server/modules/content-items/content-items.service";

export const contentItemsRouter = createTRPCRouter({
  list: protectedProcedure.input(listContentItemsInputSchema).query(({ ctx, input }) =>
    getContentItems(ctx.prisma, ctx.user.id, input),
  ),
  create: protectedProcedure.input(createContentItemInputSchema).mutation(({ ctx, input }) =>
    addContentItem(ctx.prisma, ctx.user.id, input),
  ),
  update: protectedProcedure.input(updateContentItemInputSchema).mutation(({ ctx, input }) =>
    editContentItem(ctx.prisma, ctx.user.id, input),
  ),
  delete: protectedProcedure.input(deleteContentItemInputSchema).mutation(({ ctx, input }) =>
    removeContentItem(ctx.prisma, ctx.user.id, input),
  ),
});
