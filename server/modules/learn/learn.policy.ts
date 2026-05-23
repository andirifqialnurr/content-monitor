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
