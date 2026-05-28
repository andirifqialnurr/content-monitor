import { z } from "zod";

export const checkoutProductInputSchema = z.object({
  productId: z.string().cuid(),
});

export const getPaymentOrderInputSchema = z.object({
  orderId: z.string().cuid(),
});

export type CheckoutProductInput = z.infer<typeof checkoutProductInputSchema>;
export type GetPaymentOrderInput = z.infer<typeof getPaymentOrderInputSchema>;
