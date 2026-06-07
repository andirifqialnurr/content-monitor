import { createTRPCRouter } from "@/server/trpc/root";
import { protectedProcedure } from "@/server/trpc/procedures";
import {
  getLearnerCourseInputSchema,
  submitQuizAttemptInputSchema,
  updateLessonProgressInputSchema,
} from "@/server/modules/learn/learn.schema";
import {
  getLearnerCourse,
  getLearnerCourses,
  saveLessonProgress,
  submitQuizAttempt,
} from "@/server/modules/learn/learn.service";

export const learnRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => getLearnerCourses(ctx.prisma, ctx.user.id)),
  get: protectedProcedure.input(getLearnerCourseInputSchema).query(({ ctx, input }) =>
    getLearnerCourse(ctx.prisma, ctx.user.id, input),
  ),
  updateProgress: protectedProcedure.input(updateLessonProgressInputSchema).mutation(({ ctx, input }) =>
    saveLessonProgress(ctx.prisma, ctx.user.id, input),
  ),
  submitQuiz: protectedProcedure.input(submitQuizAttemptInputSchema).mutation(({ ctx, input }) =>
    submitQuizAttempt(ctx.prisma, ctx.user.id, input),
  ),
});
