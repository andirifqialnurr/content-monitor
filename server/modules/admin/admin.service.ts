import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  createAdminAuditLog,
  findAdminProductById,
  findAdminUserById,
  getPlatformCounts,
  getPlatformRevenue,
  groupOrdersByStatus,
  groupPaymentsByStatus,
  listAdminContentItems,
  listAdminProducts,
  listAdminUsers,
  listRecentAdminAuditLogs,
  listRecentAdminOrders,
  listRecentAdminPayments,
  updateAdminProductModerationById,
  updateAdminUserStatusById,
} from "@/server/modules/admin/admin.repository";
import type {
  UpdateAdminProductModerationInput,
  UpdateAdminUserStatusInput,
} from "@/server/modules/admin/admin.schema";

export type AdminListFilters = {
  query?: string;
  status?: string;
  role?: string;
  provider?: string;
  type?: string;
  moderationStatus?: string;
};

export async function getAdminOverview(prisma: PrismaClient) {
  const [counts, revenue, orderStatusGroups, paymentStatusGroups, recentOrders, recentPayments, auditLogs] =
    await Promise.all([
      getPlatformCounts(prisma),
      getPlatformRevenue(prisma),
      groupOrdersByStatus(prisma),
      groupPaymentsByStatus(prisma),
      listRecentAdminOrders(prisma, 8),
      listRecentAdminPayments(prisma, 8),
      listRecentAdminAuditLogs(prisma, 8),
    ]);

  return {
    summary: {
      ...counts,
      revenue: revenue._sum.amount ?? 0,
      orderPaidRate: calculateRate(counts.paidOrders, counts.totalOrders),
      courseCompletionRate: calculateRate(counts.completedEnrollments, counts.activeEnrollments),
    },
    orderStatusGroups,
    paymentStatusGroups,
    recentOrders,
    recentPayments,
    auditLogs,
  };
}

export function getAdminOrders(prisma: PrismaClient, filters: AdminListFilters = {}) {
  return listRecentAdminOrders(prisma, 50, {
    query: filters.query,
    status: toEnum(filters.status),
  });
}

export function getAdminPayments(prisma: PrismaClient, filters: AdminListFilters = {}) {
  return listRecentAdminPayments(prisma, 50, {
    query: filters.query,
    status: toEnum(filters.status),
    provider: toEnum(filters.provider),
  });
}

export function getAdminUsers(prisma: PrismaClient, filters: AdminListFilters = {}) {
  return listAdminUsers(prisma, 100, {
    query: filters.query,
    status: toEnum(filters.status),
    role: toEnum(filters.role),
  });
}

export function getAdminContentItems(prisma: PrismaClient, filters: AdminListFilters = {}) {
  return listAdminContentItems(prisma, 100, {
    query: filters.query,
    status: toEnum(filters.status),
    type: toEnum(filters.type),
  });
}

export function getAdminProducts(prisma: PrismaClient, filters: AdminListFilters = {}) {
  return listAdminProducts(prisma, 100, {
    query: filters.query,
    status: toEnum(filters.status),
    moderationStatus: toEnum(filters.moderationStatus),
    type: toEnum(filters.type),
  });
}

export function getAdminAuditLogs(prisma: PrismaClient) {
  return listRecentAdminAuditLogs(prisma, 50);
}

export async function updateAdminUserStatus(
  prisma: PrismaClient,
  actorUserId: string,
  input: UpdateAdminUserStatusInput,
) {
  const user = await findAdminUserById(prisma, input.id);

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User tidak ditemukan.",
    });
  }

  if (user.id === actorUserId && input.status === "INACTIVE") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Admin tidak bisa menonaktifkan akunnya sendiri.",
    });
  }

  const updatedUser = await updateAdminUserStatusById(prisma, input);
  await createAdminAuditLog(prisma, {
    actorUserId,
    targetUserId: user.id,
    action: "USER_STATUS_UPDATED",
    metadataJson: JSON.stringify({
      previousStatus: user.status,
      nextStatus: input.status,
      targetEmail: user.email,
    }),
  });

  return updatedUser;
}

export async function updateAdminProductModeration(
  prisma: PrismaClient,
  actorUserId: string,
  input: UpdateAdminProductModerationInput,
) {
  const product = await findAdminProductById(prisma, input.id);

  if (!product) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Produk tidak ditemukan.",
    });
  }

  const updatedProduct = await updateAdminProductModerationById(prisma, input);
  await createAdminAuditLog(prisma, {
    actorUserId,
    targetProductId: product.id,
    action: "PRODUCT_MODERATION_UPDATED",
    metadataJson: JSON.stringify({
      previousStatus: product.moderationStatus,
      nextStatus: input.moderationStatus,
      productTitle: product.title,
    }),
  });

  return updatedProduct;
}

function calculateRate(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function toEnum<TValue extends string>(value: string | undefined) {
  return value && value !== "ALL" ? (value as TValue) : undefined;
}
