import { z } from "zod";

export const getLearnerCourseInputSchema = z.object({
  courseSlug: z.string().trim().min(1).max(120),
});

export const updateLessonProgressInputSchema = z.object({
  courseSlug: z.string().trim().min(1).max(120),
  lessonId: z.string().cuid(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).default("COMPLETED"),
});

export type GetLearnerCourseInput = z.infer<typeof getLearnerCourseInputSchema>;
export type UpdateLessonProgressInput = z.infer<typeof updateLessonProgressInputSchema>;
