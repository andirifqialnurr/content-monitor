import { createTRPCRouter } from "@/server/trpc/root";
import { protectedProcedure } from "@/server/trpc/procedures";
import {
  createCourseLessonInputSchema,
  createCourseModuleInputSchema,
  deleteCourseLessonInputSchema,
  deleteCourseModuleInputSchema,
  updateCourseLessonInputSchema,
  updateCourseModuleInputSchema,
} from "@/server/modules/courses/courses.schema";
import {
  addCourseLesson,
  addCourseModule,
  editCourseLesson,
  editCourseModule,
  removeCourseLesson,
  removeCourseModule,
} from "@/server/modules/courses/courses.service";

export const coursesRouter = createTRPCRouter({
  createModule: protectedProcedure.input(createCourseModuleInputSchema).mutation(({ ctx, input }) =>
    addCourseModule(ctx.prisma, ctx.user.id, input),
  ),
  updateModule: protectedProcedure.input(updateCourseModuleInputSchema).mutation(({ ctx, input }) =>
    editCourseModule(ctx.prisma, ctx.user.id, input),
  ),
  deleteModule: protectedProcedure.input(deleteCourseModuleInputSchema).mutation(({ ctx, input }) =>
    removeCourseModule(ctx.prisma, ctx.user.id, input),
  ),
  createLesson: protectedProcedure.input(createCourseLessonInputSchema).mutation(({ ctx, input }) =>
    addCourseLesson(ctx.prisma, ctx.user.id, input),
  ),
  updateLesson: protectedProcedure.input(updateCourseLessonInputSchema).mutation(({ ctx, input }) =>
    editCourseLesson(ctx.prisma, ctx.user.id, input),
  ),
  deleteLesson: protectedProcedure.input(deleteCourseLessonInputSchema).mutation(({ ctx, input }) =>
    removeCourseLesson(ctx.prisma, ctx.user.id, input),
  ),
});
