import type { PrismaClient } from "@prisma/client";

export async function getPlatformCounts(prisma: PrismaClient) {
  const [
    totalUsers,
    totalProducts,
    activeProducts,
    totalOrders,
    paidOrders,
    pendingOrders,
    activeEnrollments,
    completedEnrollments,
    failedTransactions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.enrollment.count({ where: { completedAt: { not: null } } }),
    prisma.paymentTransaction.count({ where: { status: "FAILED" } }),
  ]);

  return {
    totalUsers,
    totalProducts,
    activeProducts,
    totalOrders,
    paidOrders,
    pendingOrders,
    activeEnrollments,
    completedEnrollments,
    failedTransactions,
  };
}

export function getPlatformRevenue(prisma: PrismaClient) {
  return prisma.order.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });
}

export function listRecentAdminOrders(prisma: PrismaClient, limit = 20) {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
        },
      },
      enrollment: {
        select: {
          id: true,
          status: true,
          completedAt: true,
        },
      },
      product: {
        select: {
          id: true,
          title: true,
          type: true,
          slug: true,
          status: true,
        },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export function listRecentAdminPayments(prisma: PrismaClient, limit = 20) {
  return prisma.paymentTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      order: {
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
          product: {
            select: {
              id: true,
              title: true,
              type: true,
              slug: true,
            },
          },
        },
      },
    },
  });
}

export function listAdminUsers(prisma: PrismaClient, limit = 100) {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      _count: {
        select: {
          contentItems: true,
          products: true,
          createdOrders: true,
          learnerEnrollments: true,
        },
      },
      publicPage: {
        select: {
          id: true,
          isPublished: true,
          updatedAt: true,
        },
      },
    },
  });
}

export function listAdminContentItems(prisma: PrismaClient, limit = 100) {
  return prisma.contentItem.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
        },
      },
      _count: {
        select: {
          pageBlocks: true,
        },
      },
    },
  });
}

export function listAdminProducts(prisma: PrismaClient, limit = 100) {
  return prisma.product.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
          modules: true,
          orders: true,
          pageBlocks: true,
        },
      },
    },
  });
}

export function findAdminUserById(prisma: PrismaClient, id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export function updateAdminUserStatusById(
  prisma: PrismaClient,
  params: {
    id: string;
    status: "ACTIVE" | "INACTIVE";
  },
) {
  return prisma.user.update({
    where: { id: params.id },
    data: { status: params.status },
  });
}

export function findAdminProductById(prisma: PrismaClient, id: string) {
  return prisma.product.findUnique({
    where: { id },
  });
}

export function updateAdminProductModerationById(
  prisma: PrismaClient,
  params: {
    id: string;
    moderationStatus: "APPROVED" | "REVIEW_REQUIRED" | "DISABLED";
  },
) {
  return prisma.product.update({
    where: { id: params.id },
    data: { moderationStatus: params.moderationStatus },
  });
}

export function createAdminAuditLog(
  prisma: PrismaClient,
  params: {
    actorUserId: string;
    targetUserId?: string | null;
    targetProductId?: string | null;
    action: "USER_STATUS_UPDATED" | "PRODUCT_MODERATION_UPDATED";
    metadataJson?: string | null;
  },
) {
  return prisma.adminAuditLog.create({
    data: params,
  });
}

export function listRecentAdminAuditLogs(prisma: PrismaClient, limit = 20) {
  return prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
        },
      },
      targetProduct: {
        select: {
          id: true,
          title: true,
          type: true,
          slug: true,
        },
      },
    },
  });
}

export function groupOrdersByStatus(prisma: PrismaClient) {
  return prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
}

export function groupPaymentsByStatus(prisma: PrismaClient) {
  return prisma.paymentTransaction.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
}
