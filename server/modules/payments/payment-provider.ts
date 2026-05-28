import type {
  OrderStatus,
  PaymentProvider,
  PaymentTransactionStatus,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { createMidtransProvider } from "@/server/modules/payments/midtrans-provider";

export type PaymentCheckoutRequest = {
  orderId: string;
  productId: string;
  productTitle: string;
  amount: number;
  currency: string;
  buyerEmail: string;
  buyerName?: string | null;
  returnUrl: string;
};

export type PaymentCheckoutResult = {
  provider: PaymentProvider;
  providerReference: string | null;
  checkoutUrl: string;
  rawPayloadJson?: string;
};

export type PaymentWebhookEvent = {
  provider: PaymentProvider;
  orderId: string;
  providerReference?: string | null;
  orderStatus: OrderStatus;
  transactionStatus: PaymentTransactionStatus;
  rawPayloadJson: string;
};

export type PaymentProviderAdapter = {
  provider: PaymentProvider;
  createCheckoutSession(request: PaymentCheckoutRequest): Promise<PaymentCheckoutResult>;
  parseWebhook(payload: unknown): PaymentWebhookEvent;
};

export function createPaymentProviderAdapter(provider: PaymentProvider = "MIDTRANS"): PaymentProviderAdapter {
  if (provider === "MIDTRANS") {
    return createMidtransProvider();
  }

  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Provider payment belum didukung.",
  });
}
