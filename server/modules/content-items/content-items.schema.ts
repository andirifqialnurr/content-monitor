import { z } from "zod";

export const contentTypeSchema = z.enum(["VIDEO_SHORT", "CAROUSEL_POST", "BLOG", "LONG_VIDEO"]);
export const contentStatusSchema = z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]);

const optionalTextSchema = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .transform((value) => (value ? value : undefined));

const scheduledAtSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? new Date(value) : undefined))
  .refine((value) => !value || !Number.isNaN(value.getTime()), "Tanggal schedule tidak valid.");

const dateTimeSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? new Date(value) : undefined))
  .refine((value) => !value || !Number.isNaN(value.getTime()), "Tanggal event tidak valid.");

const timezoneSchema = z.string().trim().min(3).max(80).optional();

export const listContentItemsInputSchema = z.object({
  type: contentTypeSchema.optional(),
  status: contentStatusSchema.optional(),
  query: z.string().trim().max(100).optional(),
  from: dateTimeSchema,
  to: dateTimeSchema,
});

export const createContentItemInputSchema = z
  .object({
    type: contentTypeSchema,
    title: z.string().trim().min(2).max(160),
    body: optionalTextSchema,
    slug: optionalTextSchema,
    status: contentStatusSchema.default("DRAFT"),
    scheduledAt: scheduledAtSchema,
    startAt: dateTimeSchema,
    endAt: dateTimeSchema,
    allDay: z.boolean().default(false),
    timezone: timezoneSchema,
  })
  .refine((value) => !value.startAt || !value.endAt || value.endAt > value.startAt, {
    message: "Waktu selesai harus setelah waktu mulai.",
    path: ["endAt"],
  });

export const updateContentItemInputSchema = z
  .object({
    id: z.string().cuid(),
    type: contentTypeSchema.optional(),
    title: z.string().trim().min(2).max(160).optional(),
    body: optionalTextSchema,
    slug: optionalTextSchema,
    status: contentStatusSchema.optional(),
    scheduledAt: scheduledAtSchema,
    startAt: dateTimeSchema,
    endAt: dateTimeSchema,
    allDay: z.boolean().optional(),
    timezone: timezoneSchema,
  })
  .refine((value) => !value.startAt || !value.endAt || value.endAt > value.startAt, {
    message: "Waktu selesai harus setelah waktu mulai.",
    path: ["endAt"],
  });

export const deleteContentItemInputSchema = z.object({
  id: z.string().cuid(),
});

export type ListContentItemsInput = z.infer<typeof listContentItemsInputSchema>;
export type CreateContentItemInput = z.infer<typeof createContentItemInputSchema>;
export type UpdateContentItemInput = z.infer<typeof updateContentItemInputSchema>;
export type DeleteContentItemInput = z.infer<typeof deleteContentItemInputSchema>;
