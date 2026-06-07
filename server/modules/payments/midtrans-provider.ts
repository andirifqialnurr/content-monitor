import { createHash } from "node:crypto";
import type { OrderStatus, PaymentTransactionStatus, PlatformPaymentMode } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type {
  PaymentCheckoutRequest,
  PaymentCheckoutResult,
  PaymentProviderAdapter,
  PaymentWebhookEvent,
} from "@/server/modules/payments/payment-provider";

type MidtransCheckoutResponse = {
  token?: string;
  redirect_url?: string;
  error_messages?: string[];
};

type MidtransWebhookPayload = {
  order_id?: unknown;
  transaction_id?: unknown;
  transaction_status?: unknown;
  fraud_status?: unknown;
  status_code?: unknown;
  gross_amount?: unknown;
  signature_key?: unknown;
};

export function createMidtransProvider(options: { paymentMode?: PlatformPaymentMode } = {}): PaymentProviderAdapter {
  const config = getMidtransConfig(options.paymentMode);

  return {
    provider: "MIDTRANS",
    createCheckoutSession: (request) => createCheckoutSession(config, request),
    parseWebhook: (payload) => parseWebhook(config.serverKey, payload),
  };
}

async function createCheckoutSession(
  config: ReturnType<typeof getMidtransConfig>,
  request: PaymentCheckoutRequest,
): Promise<PaymentCheckoutResult> {
  if (request.currency !== "IDR") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Midtrans checkout hanya mendukung currency IDR.",
    });
  }

  const payload = {
    transaction_details: {
      order_id: request.orderId,
      gross_amount: request.amount,
    },
    customer_details: {
      first_name: request.buyerName ?? request.buyerEmail,
      email: request.buyerEmail,
    },
    item_details: [
      {
        id: request.productId,
        price: request.amount,
        quantity: 1,
        name: truncateMidtransItemName(request.productTitle),
      },
    ],
    callbacks: {
      finish: request.returnUrl,
      error: request.returnUrl,
      pending: request.returnUrl,
    },
  };

  const response = await fetch(`${config.apiBaseUrl}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Basic ${Buffer.from(`${config.serverKey}:`).toString("base64")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const result = (await response.json().catch(() => null)) as MidtransCheckoutResponse | null;

  if (!response.ok || !result?.redirect_url) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: result?.error_messages?.join(" ") ?? "Gagal membuat checkout Midtrans.",
    });
  }

  return {
    provider: "MIDTRANS",
    providerReference: result.token ?? null,
    checkoutUrl: result.redirect_url,
    rawPayloadJson: JSON.stringify(result),
  };
}

function parseWebhook(serverKey: string, payload: unknown): PaymentWebhookEvent {
  const data = payload as MidtransWebhookPayload;
  const orderId = readString(data.order_id);
  const statusCode = readString(data.status_code);
  const grossAmount = readString(data.gross_amount);
  const signatureKey = readString(data.signature_key);

  if (!orderId || !statusCode || !grossAmount || !signatureKey) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Payload webhook Midtrans tidak lengkap.",
    });
  }

  const expectedSignature = createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");

  if (signatureKey !== expectedSignature) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Signature webhook Midtrans tidak valid.",
    });
  }

  const mappedStatus = mapMidtransStatus(
    readString(data.transaction_status),
    readString(data.fraud_status),
  );

  return {
    provider: "MIDTRANS",
    orderId,
    providerReference: readString(data.transaction_id),
    orderStatus: mappedStatus.orderStatus,
    transactionStatus: mappedStatus.transactionStatus,
    rawPayloadJson: JSON.stringify(payload),
  };
}

function getMidtransConfig(paymentMode?: PlatformPaymentMode) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "MIDTRANS_SERVER_KEY belum dikonfigurasi.",
    });
  }

  const isProduction = paymentMode ? paymentMode === "PRODUCTION" : process.env.MIDTRANS_IS_PRODUCTION === "true";

  return {
    serverKey,
    apiBaseUrl: isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com",
  };
}

function mapMidtransStatus(
  transactionStatus: string | null,
  fraudStatus: string | null,
): {
  orderStatus: OrderStatus;
  transactionStatus: PaymentTransactionStatus;
} {
  if (transactionStatus === "settlement") {
    return { orderStatus: "PAID", transactionStatus: "PAID" };
  }

  if (transactionStatus === "capture") {
    return fraudStatus === "challenge"
      ? { orderStatus: "PENDING", transactionStatus: "PENDING" }
      : { orderStatus: "PAID", transactionStatus: "PAID" };
  }

  if (transactionStatus === "pending") {
    return { orderStatus: "PENDING", transactionStatus: "PENDING" };
  }

  if (transactionStatus === "expire") {
    return { orderStatus: "EXPIRED", transactionStatus: "EXPIRED" };
  }

  if (transactionStatus === "refund" || transactionStatus === "partial_refund") {
    return { orderStatus: "REFUNDED", transactionStatus: "REFUNDED" };
  }

  return { orderStatus: "FAILED", transactionStatus: "FAILED" };
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function truncateMidtransItemName(value: string) {
  return value.length > 50 ? `${value.slice(0, 47)}...` : value;
}
