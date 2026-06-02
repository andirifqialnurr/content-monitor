import { z } from "zod";

const learnEntityIdSchema = z.string().trim().min(1).max(128);

export const getLearnerCourseInputSchema = z.object({
  courseSlug: z.string().trim().min(1).max(120),
});

export const updateLessonProgressInputSchema = z.object({
  courseSlug: z.string().trim().min(1).max(120),
  lessonId: learnEntityIdSchema,
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).default("COMPLETED"),
});

const quizAnswerInputSchema = z.object({
  questionId: learnEntityIdSchema,
  optionId: learnEntityIdSchema.optional(),
  answerText: z.string().trim().max(5000).optional(),
});

export const submitQuizAttemptInputSchema = z.object({
  courseSlug: z.string().trim().min(1).max(120),
  quizId: learnEntityIdSchema,
  answers: z.array(quizAnswerInputSchema).min(1),
});

export type GetLearnerCourseInput = z.infer<typeof getLearnerCourseInputSchema>;
export type UpdateLessonProgressInput = z.infer<typeof updateLessonProgressInputSchema>;
export type SubmitQuizAttemptInput = z.infer<typeof submitQuizAttemptInputSchema>;
