import type { AnalyticsEventType, PrismaClient } from "@prisma/client";
import {
  countActiveEnrollments,
  countAnalyticsEvent,
  countCompletedEnrollments,
  getPaidOrderAggregate,
  getQuizAttemptAggregate,
  groupAnalyticsEventsByProduct,
  groupPaidOrdersByProduct,
  listUserProductsForStatistics,
} from "@/server/modules/statistics/statistics.repository";

const eventTypes = [
  "PAGE_VIEW",
  "LINK_CLICK",
  "PRODUCT_CLICK",
  "CHECKOUT_STARTED",
  "PURCHASE_COMPLETED",
  "COURSE_STARTED",
  "LESSON_COMPLETED",
  "QUIZ_SUBMITTED",
] satisfies AnalyticsEventType[];

export async function getUserStatistics(prisma: PrismaClient, userId: string) {
  const [
    eventCounts,
    paidOrders,
    activeEnrollments,
    completedEnrollments,
    quizAttempts,
    products,
    eventGroups,
    orderGroups,
  ] = await Promise.all([
    getEventCounts(prisma, userId),
    getPaidOrderAggregate(prisma, userId),
    countActiveEnrollments(prisma, userId),
    countCompletedEnrollments(prisma, userId),
    getQuizAttemptAggregate(prisma, userId),
    listUserProductsForStatistics(prisma, userId),
    groupAnalyticsEventsByProduct(prisma, userId),
    groupPaidOrdersByProduct(prisma, userId),
  ]);

  const productPerformance = products.map((product) => {
    const productEvents = eventGroups.filter((event) => event.productId === product.id);
    const productOrders = orderGroups.find((order) => order.productId === product.id);
    const productClicks = getProductEventCount(productEvents, "PRODUCT_CLICK");
    const purchases = productOrders?._count._all ?? 0;

    return {
      ...product,
      pageViews: getProductEventCount(productEvents, "PAGE_VIEW"),
      productClicks,
      checkoutStarted: getProductEventCount(productEvents, "CHECKOUT_STARTED"),
      purchases,
      revenue: productOrders?._sum.amount ?? 0,
      conversionRate: calculateRate(purchases, productClicks),
    };
  });

  return {
    summary: {
      pageViews: eventCounts.PAGE_VIEW,
      linkClicks: eventCounts.LINK_CLICK,
      productClicks: eventCounts.PRODUCT_CLICK,
      checkoutStarted: eventCounts.CHECKOUT_STARTED,
      purchases: paidOrders._count._all,
      purchaseEvents: eventCounts.PURCHASE_COMPLETED,
      revenue: paidOrders._sum.amount ?? 0,
      clickToPurchaseRate: calculateRate(paidOrders._count._all, eventCounts.PRODUCT_CLICK),
      checkoutToPurchaseRate: calculateRate(paidOrders._count._all, eventCounts.CHECKOUT_STARTED),
      activeEnrollments,
      completedEnrollments,
      courseStarted: eventCounts.COURSE_STARTED,
      lessonCompleted: eventCounts.LESSON_COMPLETED,
      quizSubmitted: eventCounts.QUIZ_SUBMITTED,
      quizAttempts: quizAttempts._count._all,
      averageQuizScore: Math.round(quizAttempts._avg.score ?? 0),
    },
    productPerformance,
  };
}

async function getEventCounts(prisma: PrismaClient, userId: string) {
  const entries = await Promise.all(
    eventTypes.map(async (type) => [type, await countAnalyticsEvent(prisma, userId, type)] as const),
  );

  return Object.fromEntries(entries) as Record<(typeof eventTypes)[number], number>;
}

function getProductEventCount(
  events: Array<{
    type: AnalyticsEventType;
    _count: { _all: number };
  }>,
  type: AnalyticsEventType,
) {
  return events.find((event) => event.type === type)?._count._all ?? 0;
}

function calculateRate(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}
