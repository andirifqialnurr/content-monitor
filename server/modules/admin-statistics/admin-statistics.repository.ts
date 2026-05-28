import type { PrismaClient } from "@prisma/client";

export async function getAdminStatisticsSummary(prisma: PrismaClient) {
  const [
    totalUsers,
    activeUsers,
    totalProducts,
    activeProducts,
    totalOrders,
    paidOrders,
    pendingOrders,
    failedTransactions,
    activeEnrollments,
    completedEnrollments,
    revenue,
    quizAttempts,
    activeCreatorGroups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.paymentTransaction.count({ where: { status: "FAILED" } }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.enrollment.count({ where: { completedAt: { not: null } } }),
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.quizAttempt.aggregate({
      where: { submittedAt: { not: null } },
      _count: { _all: true },
      _avg: { score: true },
    }),
    prisma.product.groupBy({
      by: ["userId"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    activeCreators: activeCreatorGroups.length,
    totalProducts,
    activeProducts,
    totalOrders,
    paidOrders,
    pendingOrders,
    failedTransactions,
    activeEnrollments,
    completedEnrollments,
    revenue: revenue._sum.amount ?? 0,
    quizAttempts: quizAttempts._count._all,
    averageQuizScore: Math.round(quizAttempts._avg.score ?? 0),
  };
}

export function listAdminOrdersSince(prisma: PrismaClient, since: Date) {
  return prisma.order.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
    },
  });
}

export function listAdminUsersSince(prisma: PrismaClient, since: Date) {
  return prisma.user.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
    },
  });
}

export function listAdminProductsSince(prisma: PrismaClient, since: Date) {
  return prisma.product.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
    },
  });
}

export function groupAdminOrdersByStatus(prisma: PrismaClient) {
  return prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
}

export function groupAdminPaymentsByStatus(prisma: PrismaClient) {
  return prisma.paymentTransaction.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
}

export function groupAdminProductsByType(prisma: PrismaClient) {
  return prisma.product.groupBy({
    by: ["type"],
    _count: { _all: true },
  });
}

export function groupAdminProductsByStatus(prisma: PrismaClient) {
  return prisma.product.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
}

export function groupAdminAnalyticsByType(prisma: PrismaClient) {
  return prisma.analyticsEvent.groupBy({
    by: ["type"],
    _count: { _all: true },
  });
}

export async function listTopAdminProductsByRevenue(prisma: PrismaClient, limit = 8) {
  const groups = await prisma.order.groupBy({
    by: ["productId"],
    where: { status: "PAID" },
    _count: { _all: true },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });
  const products = await prisma.product.findMany({
    where: { id: { in: groups.map((group) => group.productId) } },
    select: {
      id: true,
      title: true,
      type: true,
      slug: true,
      currency: true,
      user: {
        select: {
          name: true,
          username: true,
          email: true,
        },
      },
    },
  });
  const productsById = new Map(products.map((product) => [product.id, product]));

  return groups.map((group) => ({
    product: productsById.get(group.productId),
    orders: group._count._all,
    revenue: group._sum.amount ?? 0,
  }));
}

export async function listTopAdminCreatorsByRevenue(prisma: PrismaClient, limit = 8) {
  const groups = await prisma.order.groupBy({
    by: ["creatorUserId"],
    where: { status: "PAID" },
    _count: { _all: true },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });
  const users = await prisma.user.findMany({
    where: { id: { in: groups.map((group) => group.creatorUserId) } },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
  });
  const usersById = new Map(users.map((user) => [user.id, user]));

  return groups.map((group) => ({
    creator: usersById.get(group.creatorUserId),
    orders: group._count._all,
    revenue: group._sum.amount ?? 0,
  }));
}
