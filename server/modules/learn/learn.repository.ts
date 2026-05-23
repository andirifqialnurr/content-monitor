import type { Prisma, PrismaClient, ProgressStatus } from "@prisma/client";

type FindLearnerCourseParams = {
  learnerUserId: string;
  courseSlug: string;
};

type UpsertLessonProgressParams = {
  enrollmentId: string;
  lessonId: string;
  status: ProgressStatus;
};

const learnerCourseInclude = {
  product: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
        },
      },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              resources: { orderBy: { order: "asc" } },
              quizzes: {
                orderBy: { order: "asc" },
                include: {
                  questions: {
                    orderBy: { order: "asc" },
                    include: { options: { orderBy: { order: "asc" } } },
                  },
                },
              },
            },
          },
          quizzes: {
            orderBy: { order: "asc" },
            include: {
              questions: {
                orderBy: { order: "asc" },
                include: { options: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
      quizzes: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: { options: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  },
  progress: true,
} satisfies Prisma.EnrollmentInclude;

export function listLearnerCourses(prisma: PrismaClient, learnerUserId: string) {
  return prisma.enrollment.findMany({
    where: {
      learnerUserId,
      status: "ACTIVE",
      product: {
        type: "COURSE",
      },
    },
    orderBy: { startedAt: "desc" },
    include: learnerCourseInclude,
  });
}

export function findLearnerCourseBySlug(prisma: PrismaClient, params: FindLearnerCourseParams) {
  return prisma.enrollment.findFirst({
    where: {
      learnerUserId: params.learnerUserId,
      status: "ACTIVE",
      product: {
        slug: params.courseSlug,
        type: "COURSE",
      },
    },
    include: learnerCourseInclude,
  });
}

export function upsertLessonProgress(prisma: PrismaClient, params: UpsertLessonProgressParams) {
  const now = new Date();
  const progressDates = getProgressDates(params.status, now);

  return prisma.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: params.enrollmentId,
        lessonId: params.lessonId,
      },
    },
    create: {
      enrollmentId: params.enrollmentId,
      lessonId: params.lessonId,
      status: params.status,
      ...progressDates,
    },
    update: {
      status: params.status,
      ...progressDates,
    },
  });
}

function getProgressDates(status: ProgressStatus, date: Date) {
  if (status === "NOT_STARTED") {
    return {
      startedAt: null,
      completedAt: null,
    };
  }

  return {
    startedAt: date,
    completedAt: status === "COMPLETED" ? date : null,
  };
}
