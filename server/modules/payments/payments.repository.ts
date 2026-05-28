import type {
  OrderStatus,
  PaymentProvider,
  PaymentTransactionStatus,
  PrismaClient,
} from "@prisma/client";

type CreatePendingOrderParams = {
  creatorUserId: string;
  buyerUserId: string;
  productId: string;
  buyerEmail: string;
  buyerName?: string | null;
  amount: number;
  currency: string;
};

type CreatePaymentTransactionParams = {
  orderId: string;
  provider: PaymentProvider;
  providerReference?: string | null;
  status: PaymentTransactionStatus;
  rawPayloadJson?: string | null;
};

type ApplyPaymentStatusParams = {
  orderId: string;
  provider: PaymentProvider;
  providerReference?: string | null;
  orderStatus: OrderStatus;
  transactionStatus: PaymentTransactionStatus;
  rawPayloadJson: string;
};

export function findCheckoutProductById(prisma: PrismaClient, productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
        },
      },
    },
  });
}

export function findPaidProductOrder(prisma: PrismaClient, buyerUserId: string, productId: string) {
  return prisma.order.findFirst({
    where: {
      buyerUserId,
      productId,
      status: "PAID",
    },
    select: { id: true },
  });
}

export function findActiveEnrollment(prisma: PrismaClient, learnerUserId: string, productId: string) {
  return prisma.enrollment.findFirst({
    where: {
      learnerUserId,
      productId,
      status: "ACTIVE",
    },
    select: { id: true },
  });
}

export function findOrderForUser(prisma: PrismaClient, orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [{ buyerUserId: userId }, { creatorUserId: userId }],
    },
    include: {
      enrollment: {
        select: {
          id: true,
          status: true,
        },
      },
      product: {
        select: {
          id: true,
          type: true,
          title: true,
          slug: true,
          price: true,
          currency: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
            },
          },
        },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
}

export function createPendingOrder(prisma: PrismaClient, params: CreatePendingOrderParams) {
  return prisma.order.create({
    data: {
      creatorUserId: params.creatorUserId,
      buyerUserId: params.buyerUserId,
      productId: params.productId,
      buyerEmail: params.buyerEmail,
      buyerName: params.buyerName,
      amount: params.amount,
      currency: params.currency,
      status: "PENDING",
    },
  });
}

export function createPaymentTransaction(prisma: PrismaClient, params: CreatePaymentTransactionParams) {
  return prisma.paymentTransaction.create({
    data: {
      orderId: params.orderId,
      provider: params.provider,
      providerReference: params.providerReference,
      status: params.status,
      rawPayloadJson: params.rawPayloadJson,
    },
  });
}

export function updateOrderStatus(prisma: PrismaClient, orderId: string, status: OrderStatus) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}

export async function applyPaymentStatus(prisma: PrismaClient, params: ApplyPaymentStatusParams) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: params.orderId },
      data: { status: params.orderStatus },
      include: { product: true },
    });
    const transaction = await tx.paymentTransaction.findFirst({
      where: {
        orderId: params.orderId,
        provider: params.provider,
      },
      orderBy: { createdAt: "desc" },
    });

    if (transaction) {
      await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          providerReference: params.providerReference ?? transaction.providerReference,
          status: params.transactionStatus,
          rawPayloadJson: params.rawPayloadJson,
        },
      });
    } else {
      await tx.paymentTransaction.create({
        data: {
          orderId: params.orderId,
          provider: params.provider,
          providerReference: params.providerReference,
          status: params.transactionStatus,
          rawPayloadJson: params.rawPayloadJson,
        },
      });
    }

    if (params.orderStatus === "PAID" && order.product.type === "COURSE" && order.buyerUserId) {
      await tx.enrollment.upsert({
        where: {
          learnerUserId_productId: {
            learnerUserId: order.buyerUserId,
            productId: order.productId,
          },
        },
        create: {
          learnerUserId: order.buyerUserId,
          creatorUserId: order.creatorUserId,
          productId: order.productId,
          orderId: order.id,
          status: "ACTIVE",
        },
        update: {
          creatorUserId: order.creatorUserId,
          orderId: order.id,
          status: "ACTIVE",
        },
      });
    }

    return order;
  });
}
