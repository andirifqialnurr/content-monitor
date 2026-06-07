import {
  changePasswordInputSchema,
  updateAccountProfileInputSchema,
} from "@/server/modules/account/account.schema";
import {
  changeAccountPassword,
  getAccountProfile,
  saveAccountProfile,
} from "@/server/modules/account/account.service";
import { createTRPCRouter } from "@/server/trpc/root";
import { protectedProcedure } from "@/server/trpc/procedures";

export const accountRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(({ ctx }) => getAccountProfile(ctx.prisma, ctx.user.id)),
  updateProfile: protectedProcedure.input(updateAccountProfileInputSchema).mutation(({ ctx, input }) =>
    saveAccountProfile(ctx.prisma, ctx.user.id, input),
  ),
  changePassword: protectedProcedure.input(changePasswordInputSchema).mutation(({ ctx, input }) =>
    changeAccountPassword(ctx.prisma, ctx.user.id, input),
  ),
});
