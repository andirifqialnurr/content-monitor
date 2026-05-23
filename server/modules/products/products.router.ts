import { createTRPCRouter } from "@/server/trpc/root";
import { protectedProcedure } from "@/server/trpc/procedures";
import {
  createProductInputSchema,
  deleteProductInputSchema,
  getProductInputSchema,
  listProductsInputSchema,
  updateProductInputSchema,
} from "@/server/modules/products/products.schema";
import {
  addProduct,
  editProduct,
  getProduct,
  getProducts,
  removeProduct,
} from "@/server/modules/products/products.service";

export const productsRouter = createTRPCRouter({
  list: protectedProcedure.input(listProductsInputSchema).query(({ ctx, input }) =>
    getProducts(ctx.prisma, ctx.user.id, input),
  ),
  get: protectedProcedure.input(getProductInputSchema).query(({ ctx, input }) =>
    getProduct(ctx.prisma, ctx.user.id, input),
  ),
  create: protectedProcedure.input(createProductInputSchema).mutation(({ ctx, input }) =>
    addProduct(ctx.prisma, ctx.user.id, input),
  ),
  update: protectedProcedure.input(updateProductInputSchema).mutation(({ ctx, input }) =>
    editProduct(ctx.prisma, ctx.user.id, input),
  ),
  delete: protectedProcedure.input(deleteProductInputSchema).mutation(({ ctx, input }) =>
    removeProduct(ctx.prisma, ctx.user.id, input),
  ),
});
