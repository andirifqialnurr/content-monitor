import type { ContentStatus, ContentType, Prisma, PrismaClient } from "@prisma/client";

type ListContentItemsParams = {
  userId: string;
  type?: ContentType;
  status?: ContentStatus;
  query?: string;
  from?: Date;
  to?: Date;
};

type CreateContentItemParams = {
  userId: string;
  type: ContentType;
  title: string;
  body?: string;
  slug?: string;
  status: ContentStatus;
  scheduledAt?: Date;
  startAt?: Date;
  endAt?: Date;
  allDay?: boolean;
  timezone?: string;
};

type UpdateContentItemParams = {
  id: string;
  type?: ContentType;
  title?: string;
  body?: string;
  slug?: string;
  status?: ContentStatus;
  scheduledAt?: Date;
  startAt?: Date;
  endAt?: Date;
  allDay?: boolean;
  timezone?: string;
};

export function findContentItemById(prisma: PrismaClient, id: string) {
  return prisma.contentItem.findUnique({
    where: { id },
  });
}

export function listContentItems(prisma: PrismaClient, params: ListContentItemsParams) {
  const where: Prisma.ContentItemWhereInput = {
    userId: params.userId,
    type: params.type,
    status: params.status,
  };

  if (params.query) {
    where.OR = [
      { title: { contains: params.query } },
      { body: { contains: params.query } },
      { slug: { contains: params.query } },
    ];
  }

  if (params.from || params.to) {
    where.AND = [...buildDateRangeFilter(params.from, params.to)];
  }

  return prisma.contentItem.findMany({
    where,
    orderBy: [{ startAt: "asc" }, { scheduledAt: "asc" }, { createdAt: "desc" }],
  });
}

export function createContentItem(prisma: PrismaClient, params: CreateContentItemParams) {
  return prisma.contentItem.create({
    data: params,
  });
}

export function updateContentItem(prisma: PrismaClient, params: UpdateContentItemParams) {
  const { id, ...data } = params;

  return prisma.contentItem.update({
    where: { id },
    data,
  });
}

export function deleteContentItem(prisma: PrismaClient, id: string) {
  return prisma.contentItem.delete({
    where: { id },
  });
}

function buildDateRangeFilter(from?: Date, to?: Date): Prisma.ContentItemWhereInput[] {
  const filters: Prisma.ContentItemWhereInput[] = [];

  if (to) {
    filters.push({
      OR: [{ startAt: { lt: to } }, { startAt: null, scheduledAt: { lt: to } }],
    });
  }

  if (from) {
    filters.push({
      OR: [
        { endAt: { gt: from } },
        { endAt: null, startAt: { gte: from } },
        { startAt: null, scheduledAt: { gte: from } },
      ],
    });
  }

  return filters;
}
