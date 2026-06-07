import type { AnalyticsEventType, PrismaClient } from "@prisma/client";

const trackedEventTypes = [
  "PAGE_VIEW",
  "LINK_CLICK",
  "PRODUCT_CLICK",
  "CHECKOUT_STARTED",
  "PURCHASE_COMPLETED",
  "COURSE_STARTED",
  "LESSON_COMPLETED",
  "QUIZ_SUBMITTED",
] satisfies AnalyticsEventType[];

export function countAnalyticsEvent(prisma: PrismaClient, userId: string, type: AnalyticsEventType) {
  return prisma.analyticsEvent.count({
    where: {
      userId,
      type,
    },
  });
}

export function getPaidOrderAggregate(prisma: PrismaClient, userId: string) {
  return prisma.order.aggregate({
    where: {
      creatorUserId: userId,
      status: "PAID",
    },
    _count: {
      _all: true,
    },
    _sum: {
      amount: true,
    },
  });
}

export function countActiveEnrollments(prisma: PrismaClient, userId: string) {
  return prisma.enrollment.count({
    where: {
      creatorUserId: userId,
      status: "ACTIVE",
    },
  });
}

export function countCompletedEnrollments(prisma: PrismaClient, userId: string) {
  return prisma.enrollment.count({
    where: {
      creatorUserId: userId,
      completedAt: {
        not: null,
      },
    },
  });
}

export function getQuizAttemptAggregate(prisma: PrismaClient, userId: string) {
  return prisma.quizAttempt.aggregate({
    where: {
      submittedAt: {
        not: null,
      },
      enrollment: {
        creatorUserId: userId,
      },
    },
    _count: {
      _all: true,
    },
    _avg: {
      score: true,
    },
  });
}

export function listUserProductsForStatistics(prisma: PrismaClient, userId: string) {
  return prisma.product.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      type: true,
      slug: true,
      status: true,
      price: true,
      currency: true,
    },
  });
}

export function groupAnalyticsEventsByProduct(prisma: PrismaClient, userId: string) {
  return prisma.analyticsEvent.groupBy({
    by: ["productId", "type"],
    where: {
      userId,
      productId: {
        not: null,
      },
      type: {
        in: trackedEventTypes,
      },
    },
    _count: {
      _all: true,
    },
  });
}

export function groupPaidOrdersByProduct(prisma: PrismaClient, userId: string) {
  return prisma.order.groupBy({
    by: ["productId"],
    where: {
      creatorUserId: userId,
      status: "PAID",
    },
    _count: {
      _all: true,
    },
    _sum: {
      amount: true,
    },
  });
}
