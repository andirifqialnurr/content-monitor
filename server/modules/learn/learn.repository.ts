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

type CreateQuizAttemptParams = {
  enrollmentId: string;
  quizId: string;
  score: number;
  passed: boolean;
  answersJson: string;
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
  quizAttempts: {
    orderBy: { startedAt: "desc" },
  },
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

export function findQuizById(prisma: PrismaClient, quizId: string) {
  return prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      product: true,
      module: {
        include: {
          product: true,
        },
      },
      lesson: {
        include: {
          module: {
            include: {
              product: true,
            },
          },
        },
      },
      questions: {
        orderBy: { order: "asc" },
        include: {
          options: { orderBy: { order: "asc" } },
        },
      },
    },
  });
}

export function countSubmittedQuizAttempts(prisma: PrismaClient, enrollmentId: string, quizId: string) {
  return prisma.quizAttempt.count({
    where: {
      enrollmentId,
      quizId,
      submittedAt: { not: null },
    },
  });
}

export function createQuizAttempt(prisma: PrismaClient, params: CreateQuizAttemptParams) {
  return prisma.quizAttempt.create({
    data: {
      enrollmentId: params.enrollmentId,
      quizId: params.quizId,
      score: params.score,
      passed: params.passed,
      answersJson: params.answersJson,
      submittedAt: new Date(),
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
