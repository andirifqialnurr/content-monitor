import type { ContentItem, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  createContentItem,
  deleteContentItem,
  findContentItemById,
  listContentItems,
  updateContentItem,
} from "@/server/modules/content-items/content-items.repository";
import { assertContentItemOwner } from "@/server/modules/content-items/content-items.policy";
import type {
  CreateContentItemInput,
  DeleteContentItemInput,
  ListContentItemsInput,
  UpdateContentItemInput,
} from "@/server/modules/content-items/content-items.schema";

export function getContentItems(prisma: PrismaClient, userId: string, input: ListContentItemsInput) {
  return listContentItems(prisma, {
    userId,
    type: input.type,
    status: input.status,
    query: input.query,
    from: input.from,
    to: input.to,
  });
}

export function addContentItem(prisma: PrismaClient, userId: string, input: CreateContentItemInput) {
  const schedule = normalizeCreateSchedule(input);

  return createContentItem(prisma, {
    userId,
    type: input.type,
    title: input.title,
    body: input.body,
    slug: input.slug,
    status: input.status,
    ...schedule,
  });
}

export async function editContentItem(prisma: PrismaClient, userId: string, input: UpdateContentItemInput) {
  const item = await findContentItemById(prisma, input.id);
  const ownedItem = assertContentItemOwner(item, userId);

  return updateContentItem(prisma, {
    ...input,
    ...normalizeUpdateSchedule(input, ownedItem),
  });
}

export async function removeContentItem(prisma: PrismaClient, userId: string, input: DeleteContentItemInput) {
  const item = await findContentItemById(prisma, input.id);
  assertContentItemOwner(item, userId);

  await deleteContentItem(prisma, input.id);

  return { id: input.id };
}

function normalizeCreateSchedule(input: CreateContentItemInput) {
  const startAt = input.startAt ?? input.scheduledAt;
  const endAt = input.endAt ?? getDefaultEndAt(startAt, input.allDay);
  validateEventRange(startAt, endAt);

  return {
    scheduledAt: input.scheduledAt ?? startAt,
    startAt,
    endAt,
    allDay: input.allDay,
    timezone: input.timezone ?? "Asia/Jakarta",
  };
}

function normalizeUpdateSchedule(input: UpdateContentItemInput, current: ContentItem) {
  const hasScheduleInput =
    input.scheduledAt !== undefined ||
    input.startAt !== undefined ||
    input.endAt !== undefined ||
    input.allDay !== undefined ||
    input.timezone !== undefined;

  if (!hasScheduleInput) {
    return {};
  }

  const allDay = input.allDay ?? current.allDay;
  const startAt = input.startAt ?? input.scheduledAt ?? current.startAt ?? current.scheduledAt ?? undefined;
  const shouldRecalculateEnd = Boolean(input.startAt || input.scheduledAt || input.allDay !== undefined);
  const endAt = input.endAt ?? current.endAt ?? (shouldRecalculateEnd ? getDefaultEndAt(startAt, allDay) : undefined);

  validateEventRange(startAt, endAt);

  return {
    scheduledAt: input.scheduledAt ?? input.startAt ?? current.scheduledAt ?? current.startAt ?? undefined,
    startAt,
    endAt,
    allDay,
    timezone: input.timezone ?? current.timezone,
  };
}

function getDefaultEndAt(startAt: Date | undefined, allDay: boolean) {
  if (!startAt) {
    return undefined;
  }

  const endAt = new Date(startAt);

  if (allDay) {
    endAt.setDate(endAt.getDate() + 1);
    return endAt;
  }

  endAt.setHours(endAt.getHours() + 1);
  return endAt;
}

function validateEventRange(startAt: Date | undefined, endAt: Date | undefined) {
  if (startAt && endAt && endAt <= startAt) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Waktu selesai harus setelah waktu mulai.",
    });
  }
}
