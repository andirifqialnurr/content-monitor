import type { AnalyticsEventType, OrderStatus, PaymentTransactionStatus, PrismaClient, ProductStatus, ProductType } from "@prisma/client";
import {
  getAdminStatisticsSummary,
  groupAdminAnalyticsByType,
  groupAdminOrdersByStatus,
  groupAdminPaymentsByStatus,
  groupAdminProductsByStatus,
  groupAdminProductsByType,
  listAdminOrdersSince,
  listAdminProductsSince,
  listAdminUsersSince,
  listTopAdminCreatorsByRevenue,
  listTopAdminProductsByRevenue,
} from "@/server/modules/admin-statistics/admin-statistics.repository";

const orderStatuses = ["PENDING", "PAID", "FAILED", "EXPIRED", "REFUNDED"] satisfies OrderStatus[];
const paymentStatuses = ["PENDING", "PAID", "FAILED", "EXPIRED", "REFUNDED"] satisfies PaymentTransactionStatus[];
const productTypes = ["EBOOK", "COURSE"] satisfies ProductType[];
const productStatuses = ["DRAFT", "ACTIVE", "INACTIVE"] satisfies ProductStatus[];
const analyticsEventTypes = [
  "PAGE_VIEW",
  "LINK_CLICK",
  "PRODUCT_CLICK",
  "CHECKOUT_STARTED",
  "PURCHASE_COMPLETED",
  "COURSE_STARTED",
  "LESSON_COMPLETED",
  "QUIZ_SUBMITTED",
] satisfies AnalyticsEventType[];

const trendWindowDays = 30;

export async function getAdminPlatformStatistics(prisma: PrismaClient) {
  const since = startOfDay(addDays(new Date(), -(trendWindowDays - 1)));
  const [
    summary,
    recentOrders,
    recentUsers,
    recentProducts,
    orderStatusGroups,
    paymentStatusGroups,
    productTypeGroups,
    productStatusGroups,
    analyticsGroups,
    topProducts,
    topCreators,
  ] = await Promise.all([
    getAdminStatisticsSummary(prisma),
    listAdminOrdersSince(prisma, since),
    listAdminUsersSince(prisma, since),
    listAdminProductsSince(prisma, since),
    groupAdminOrdersByStatus(prisma),
    groupAdminPaymentsByStatus(prisma),
    groupAdminProductsByType(prisma),
    groupAdminProductsByStatus(prisma),
    groupAdminAnalyticsByType(prisma),
    listTopAdminProductsByRevenue(prisma),
    listTopAdminCreatorsByRevenue(prisma),
  ]);
  const analyticsCounts = toCountRecord(analyticsEventTypes, analyticsGroups, "type");
  const orderTrend = buildOrderTrend(recentOrders, since);
  const growthTrend = buildGrowthTrend(recentUsers, recentProducts, since);

  return {
    summary: {
      ...summary,
      pageViews: analyticsCounts.PAGE_VIEW,
      productClicks: analyticsCounts.PRODUCT_CLICK,
      checkoutStarted: analyticsCounts.CHECKOUT_STARTED,
      purchaseEvents: analyticsCounts.PURCHASE_COMPLETED,
      clickToPurchaseRate: calculateRate(summary.paidOrders, analyticsCounts.PRODUCT_CLICK),
      checkoutToPurchaseRate: calculateRate(summary.paidOrders, analyticsCounts.CHECKOUT_STARTED),
      courseCompletionRate: calculateRate(summary.completedEnrollments, summary.activeEnrollments),
    },
    trends: {
      categories: orderTrend.categories,
      revenue: orderTrend.revenue,
      totalOrders: orderTrend.totalOrders,
      paidOrders: orderTrend.paidOrders,
      newUsers: growthTrend.newUsers,
      newProducts: growthTrend.newProducts,
    },
    distributions: {
      orderStatus: toDistribution(orderStatuses, orderStatusGroups, "status"),
      paymentStatus: toDistribution(paymentStatuses, paymentStatusGroups, "status"),
      productType: toDistribution(productTypes, productTypeGroups, "type"),
      productStatus: toDistribution(productStatuses, productStatusGroups, "status"),
      analytics: toDistribution(analyticsEventTypes, analyticsGroups, "type"),
    },
    topProducts: topProducts.map((item) => ({
      id: item.product?.id ?? "unknown",
      title: item.product?.title ?? "Produk tidak ditemukan",
      type: item.product?.type ?? "EBOOK",
      slug: item.product?.slug ?? "-",
      owner: item.product?.user.name ?? item.product?.user.username ?? item.product?.user.email ?? "-",
      currency: item.product?.currency ?? "IDR",
      orders: item.orders,
      revenue: item.revenue,
    })),
    topCreators: topCreators.map((item) => ({
      id: item.creator?.id ?? "unknown",
      name: item.creator?.name ?? item.creator?.username ?? item.creator?.email ?? "-",
      username: item.creator?.username ?? "-",
      email: item.creator?.email ?? "-",
      orders: item.orders,
      revenue: item.revenue,
    })),
  };
}

function buildOrderTrend(
  orders: Awaited<ReturnType<typeof listAdminOrdersSince>>,
  since: Date,
) {
  const buckets = createDayBuckets(since);

  for (const order of orders) {
    const bucket = buckets.get(toDateKey(order.createdAt));

    if (!bucket) {
      continue;
    }

    bucket.totalOrders += 1;

    if (order.status === "PAID") {
      bucket.paidOrders += 1;
      bucket.revenue += order.amount;
    }
  }

  const values = Array.from(buckets.values());

  return {
    categories: values.map((bucket) => bucket.label),
    revenue: values.map((bucket) => bucket.revenue),
    totalOrders: values.map((bucket) => bucket.totalOrders),
    paidOrders: values.map((bucket) => bucket.paidOrders),
  };
}

function buildGrowthTrend(
  users: Awaited<ReturnType<typeof listAdminUsersSince>>,
  products: Awaited<ReturnType<typeof listAdminProductsSince>>,
  since: Date,
) {
  const buckets = createDayBuckets(since);

  for (const user of users) {
    const bucket = buckets.get(toDateKey(user.createdAt));
    if (bucket) {
      bucket.newUsers += 1;
    }
  }

  for (const product of products) {
    const bucket = buckets.get(toDateKey(product.createdAt));
    if (bucket) {
      bucket.newProducts += 1;
    }
  }

  const values = Array.from(buckets.values());

  return {
    newUsers: values.map((bucket) => bucket.newUsers),
    newProducts: values.map((bucket) => bucket.newProducts),
  };
}

function createDayBuckets(since: Date) {
  const buckets = new Map<string, {
    label: string;
    revenue: number;
    totalOrders: number;
    paidOrders: number;
    newUsers: number;
    newProducts: number;
  }>();

  for (let index = 0; index < trendWindowDays; index += 1) {
    const date = addDays(since, index);
    buckets.set(toDateKey(date), {
      label: formatDateLabel(date),
      revenue: 0,
      totalOrders: 0,
      paidOrders: 0,
      newUsers: 0,
      newProducts: 0,
    });
  }

  return buckets;
}

function toDistribution<TValue extends string>(
  values: readonly TValue[],
  groups: Array<Record<string, unknown> & { _count: { _all: number } }>,
  key: string,
) {
  const countRecord = toCountRecord(values, groups, key);

  return values.map((value) => ({
    label: formatEnumLabel(value),
    value: countRecord[value],
  }));
}

function toCountRecord<TValue extends string>(
  values: readonly TValue[],
  groups: Array<Record<string, unknown> & { _count: { _all: number } }>,
  key: string,
) {
  return Object.fromEntries(
    values.map((value) => {
      const group = groups.find((item) => item[key] === value);
      return [value, group?._count._all ?? 0];
    }),
  ) as Record<TValue, number>;
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${day}/${month}`;
}

function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((word) => `${word.slice(0, 1)}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

function calculateRate(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}
