import {
  checkoutProductInputSchema,
  getPaymentOrderInputSchema,
} from "@/server/modules/payments/payments.schema";
import {
  getUserPaymentDashboard,
  getPaymentOrder,
  startProductCheckout,
} from "@/server/modules/payments/payments.service";
import { createTRPCRouter } from "@/server/trpc/root";
import { protectedProcedure } from "@/server/trpc/procedures";

export const paymentsRouter = createTRPCRouter({
  dashboard: protectedProcedure.query(({ ctx }) => getUserPaymentDashboard(ctx.prisma, ctx.user.id)),
  getOrder: protectedProcedure.input(getPaymentOrderInputSchema).query(({ ctx, input }) =>
    getPaymentOrder(ctx.prisma, ctx.user.id, input),
  ),
  checkout: protectedProcedure.input(checkoutProductInputSchema).mutation(({ ctx, input }) =>
    startProductCheckout(ctx.prisma, ctx.user, input),
  ),
});
