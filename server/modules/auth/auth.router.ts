import { createTRPCRouter, publicProcedure } from "@/server/trpc/root";
import {
  forgotPasswordInputSchema,
  registerInputSchema,
  resetPasswordInputSchema,
} from "@/server/modules/auth/auth.schema";
import {
  registerUser,
  requestPasswordReset,
  resetPassword,
} from "@/server/modules/auth/auth.service";

export const authRouter = createTRPCRouter({
  register: publicProcedure.input(registerInputSchema).mutation(({ ctx, input }) =>
    registerUser(ctx.prisma, input),
  ),
  forgotPassword: publicProcedure.input(forgotPasswordInputSchema).mutation(({ ctx, input }) =>
    requestPasswordReset(ctx.prisma, input),
  ),
  resetPassword: publicProcedure.input(resetPasswordInputSchema).mutation(({ ctx, input }) =>
    resetPassword(ctx.prisma, input),
  ),
});
