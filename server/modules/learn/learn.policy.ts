import type { Enrollment } from "@prisma/client";
import { TRPCError } from "@trpc/server";

type EnrollmentWithLessons = Enrollment & {
  product: {
    modules: Array<{
      lessons: Array<{
        id: string;
      }>;
    }>;
  };
};

export function assertLearnerEnrollment<TEnrollment extends Enrollment>(
  enrollment: TEnrollment | null,
  learnerUserId: string,
) {
  if (!enrollment) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Enrollment course tidak ditemukan.",
    });
  }

  if (enrollment.learnerUserId !== learnerUserId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Anda tidak punya akses ke course ini.",
    });
  }

  if (enrollment.status !== "ACTIVE") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Enrollment course tidak aktif.",
    });
  }

  return enrollment;
}

export function assertLessonBelongsToEnrollment(enrollment: EnrollmentWithLessons, lessonId: string) {
  const lesson = enrollment.product.modules.flatMap((module) => module.lessons).find((item) => item.id === lessonId);

  if (!lesson) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Lesson tidak termasuk dalam enrollment course ini.",
    });
  }

  return lesson;
}

type QuizWithCourseScope = {
  productId: string | null;
  module: { productId: string } | null;
  lesson: { module: { productId: string } } | null;
};

export function assertQuizBelongsToEnrollment<TQuiz extends QuizWithCourseScope>(
  enrollment: Enrollment,
  quiz: TQuiz | null,
) {
  if (!quiz) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Quiz tidak ditemukan.",
    });
  }

  const quizProductId = quiz.productId ?? quiz.module?.productId ?? quiz.lesson?.module.productId;

  if (!quizProductId || quizProductId !== enrollment.productId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Quiz tidak termasuk dalam enrollment course ini.",
    });
  }

  return quiz;
}
