import type { PrismaClient } from "@prisma/client";
import {
  findLearnerCourseBySlug,
  listLearnerCourses,
  upsertLessonProgress,
} from "@/server/modules/learn/learn.repository";
import {
  assertLearnerEnrollment,
  assertLessonBelongsToEnrollment,
} from "@/server/modules/learn/learn.policy";
import type {
  GetLearnerCourseInput,
  UpdateLessonProgressInput,
} from "@/server/modules/learn/learn.schema";

export function getLearnerCourses(prisma: PrismaClient, learnerUserId: string) {
  return listLearnerCourses(prisma, learnerUserId);
}

export async function getLearnerCourse(prisma: PrismaClient, learnerUserId: string, input: GetLearnerCourseInput) {
  const enrollment = await findLearnerCourseBySlug(prisma, {
    learnerUserId,
    courseSlug: input.courseSlug,
  });

  return assertLearnerEnrollment(enrollment, learnerUserId);
}

export async function saveLessonProgress(
  prisma: PrismaClient,
  learnerUserId: string,
  input: UpdateLessonProgressInput,
) {
  const enrollment = await findLearnerCourseBySlug(prisma, {
    learnerUserId,
    courseSlug: input.courseSlug,
  });
  const activeEnrollment = assertLearnerEnrollment(enrollment, learnerUserId);
  assertLessonBelongsToEnrollment(activeEnrollment, input.lessonId);

  return upsertLessonProgress(prisma, {
    enrollmentId: activeEnrollment.id,
    lessonId: input.lessonId,
    status: input.status,
  });
}
