import {
  updateAdminProductModerationInputSchema,
  updateAdminUserStatusInputSchema,
} from "@/server/modules/admin/admin.schema";
import {
  updateAdminProductModeration,
  updateAdminUserStatus,
} from "@/server/modules/admin/admin.service";
import { createTRPCRouter } from "@/server/trpc/root";
import { adminProcedure } from "@/server/trpc/procedures";

export const adminRouter = createTRPCRouter({
  updateUserStatus: adminProcedure.input(updateAdminUserStatusInputSchema).mutation(({ ctx, input }) =>
    updateAdminUserStatus(ctx.prisma, ctx.user.id, input),
  ),
  updateProductModeration: adminProcedure.input(updateAdminProductModerationInputSchema).mutation(({ ctx, input }) =>
    updateAdminProductModeration(ctx.prisma, ctx.user.id, input),
  ),
});
