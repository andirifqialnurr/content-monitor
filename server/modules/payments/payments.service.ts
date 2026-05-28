import { Prisma, type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { AuthUser } from "@/server/auth/session";
import {
  trackAnalyticsEvent,
  trackAnalyticsEventOnceByOrder,
} from "@/server/modules/analytics/analytics.service";
import { createPaymentProviderAdapter } from "@/server/modules/payments/payment-provider";
import {
  applyPaymentStatus,
  createPaymentTransaction,
  createPendingOrder,
  findActiveEnrollment,
  findCheckoutProductById,
  findOrderForUser,
  findPaidProductOrder,
  updateOrderStatus,
} from "@/server/modules/payments/payments.repository";
import {
  assertCheckoutBuyerEmail,
  assertCheckoutProduct,
} from "@/server/modules/payments/payments.policy";
import type { CheckoutProductInput } from "@/server/modules/payments/payments.schema";
import type { GetPaymentOrderInput } from "@/server/modules/payments/payments.schema";

export async function startProductCheckout(
  prisma: PrismaClient,
  buyer: AuthUser,
  input: CheckoutProductInput,
) {
  const product = assertCheckoutProduct(await findCheckoutProductById(prisma, input.productId), buyer.id);
  const buyerEmail = assertCheckoutBuyerEmail(buyer.email);
  await assertProductIsNotAlreadyOwned(prisma, buyer.id, product.id, product.type);

  const provider = createPaymentProviderAdapter("MIDTRANS");
  const order = await createPendingOrder(prisma, {
    creatorUserId: product.userId,
    buyerUserId: buyer.id,
    productId: product.id,
    buyerEmail,
    buyerName: buyer.name,
    amount: product.price,
    currency: product.currency,
  });

  try {
    const checkout = await provider.createCheckoutSession({
      orderId: order.id,
      productId: product.id,
      productTitle: product.title,
      amount: product.price,
      currency: product.currency,
      buyerEmail,
      buyerName: buyer.name,
      returnUrl: `${getAppBaseUrl()}/payment/orders/${order.id}`,
    });

    await createPaymentTransaction(prisma, {
      orderId: order.id,
      provider: checkout.provider,
      providerReference: checkout.providerReference,
      status: "PENDING",
      rawPayloadJson: checkout.rawPayloadJson,
    });
    await trackAnalyticsEvent(prisma, {
      userId: product.userId,
      productId: product.id,
      type: "CHECKOUT_STARTED",
      metadata: {
        orderId: order.id,
        buyerUserId: buyer.id,
        amount: product.price,
        currency: product.currency,
        provider: checkout.provider,
      },
    }).catch(() => null);

    return {
      orderId: order.id,
      provider: checkout.provider,
      checkoutUrl: checkout.checkoutUrl,
      status: order.status,
    };
  } catch (error) {
    await updateOrderStatus(prisma, order.id, "FAILED").catch(() => null);
    throw error;
  }
}

export async function getPaymentOrder(
  prisma: PrismaClient,
  userId: string,
  input: GetPaymentOrderInput,
) {
  const order = await findOrderForUser(prisma, input.orderId, userId);

  if (!order) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Order payment tidak ditemukan.",
    });
  }

  return order;
}

export async function handlePaymentWebhook(prisma: PrismaClient, payload: unknown) {
  const provider = createPaymentProviderAdapter("MIDTRANS");
  const event = provider.parseWebhook(payload);

  try {
    const order = await applyPaymentStatus(prisma, event);

    if (event.orderStatus === "PAID") {
      await trackAnalyticsEventOnceByOrder(prisma, {
        orderId: order.id,
        userId: order.creatorUserId,
        productId: order.productId,
        type: "PURCHASE_COMPLETED",
        metadata: {
          buyerUserId: order.buyerUserId,
          amount: order.amount,
          currency: order.currency,
          productType: order.product.type,
          provider: event.provider,
        },
      }).catch(() => null);
    }

    return order;
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025")) {
      throw error;
    }

    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Order payment tidak ditemukan.",
    });
  }
}

function getAppBaseUrl() {
  return (process.env.NEXTAUTH_URL ?? "http://127.0.0.1:4000").replace(/\/+$/, "");
}

async function assertProductIsNotAlreadyOwned(
  prisma: PrismaClient,
  buyerUserId: string,
  productId: string,
  productType: "EBOOK" | "COURSE",
) {
  const paidOrder = await findPaidProductOrder(prisma, buyerUserId, productId);

  if (paidOrder) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Produk ini sudah pernah dibeli.",
    });
  }

  if (productType === "COURSE") {
    const enrollment = await findActiveEnrollment(prisma, buyerUserId, productId);

    if (enrollment) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Enrollment course sudah aktif.",
      });
    }
  }
}
