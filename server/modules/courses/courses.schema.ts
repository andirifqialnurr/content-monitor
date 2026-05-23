import { z } from "zod";

export const courseLessonTypeSchema = z.enum(["READING", "VIDEO"]);

const nullableTextSchema = z
  .union([z.string().max(50000), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : null;
  });

const nullableUrlSchema = z
  .union([z.string().trim().max(2048), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    return value ? value : null;
  })
  .refine((value) => {
    if (!value) {
      return true;
    }

    if (value.startsWith("/") || value.startsWith("private://")) {
      return true;
    }

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, "URL harus berupa URL lengkap atau path internal yang diawali /.");

const nullableDurationSchema = z
  .union([z.coerce.number().int().min(0).max(100000), z.null()])
  .optional();

export const createCourseModuleInputSchema = z.object({
  productId: z.string().cuid(),
  title: z.string().trim().min(2).max(160),
});

export const updateCourseModuleInputSchema = z.object({
  id: z.string().cuid(),
  title: z.string().trim().min(2).max(160),
});

export const deleteCourseModuleInputSchema = z.object({
  id: z.string().cuid(),
});

export const createCourseLessonInputSchema = z.object({
  moduleId: z.string().cuid(),
  title: z.string().trim().min(2).max(160),
  type: courseLessonTypeSchema.default("READING"),
});

export const updateCourseLessonInputSchema = z.object({
  id: z.string().cuid(),
  title: z.string().trim().min(2).max(160).optional(),
  type: courseLessonTypeSchema.optional(),
  body: nullableTextSchema,
  contentUrl: nullableUrlSchema,
  videoUrl: nullableUrlSchema,
  duration: nullableDurationSchema,
  isPreview: z.boolean().optional(),
});

export const deleteCourseLessonInputSchema = z.object({
  id: z.string().cuid(),
});

export type CreateCourseModuleInput = z.infer<typeof createCourseModuleInputSchema>;
export type UpdateCourseModuleInput = z.infer<typeof updateCourseModuleInputSchema>;
export type DeleteCourseModuleInput = z.infer<typeof deleteCourseModuleInputSchema>;
export type CreateCourseLessonInput = z.infer<typeof createCourseLessonInputSchema>;
export type UpdateCourseLessonInput = z.infer<typeof updateCourseLessonInputSchema>;
export type DeleteCourseLessonInput = z.infer<typeof deleteCourseLessonInputSchema>;
