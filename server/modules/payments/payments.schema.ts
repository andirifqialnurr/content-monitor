import { z } from "zod";

const paymentEntityIdSchema = z.string().trim().min(1).max(128);

export const checkoutProductInputSchema = z.object({
  productId: paymentEntityIdSchema,
});

export const getPaymentOrderInputSchema = z.object({
  orderId: paymentEntityIdSchema,
});

export type CheckoutProductInput = z.infer<typeof checkoutProductInputSchema>;
export type GetPaymentOrderInput = z.infer<typeof getPaymentOrderInputSchema>;
