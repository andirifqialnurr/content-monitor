import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { trackAnalyticsEvent } from "@/server/modules/analytics/analytics.service";
import {
  countSubmittedQuizAttempts,
  createQuizAttempt,
  findQuizById,
  findLearnerCourseBySlug,
  listLearnerCourses,
  updateEnrollmentCompletion,
  upsertLessonProgress,
} from "@/server/modules/learn/learn.repository";
import {
  assertLearnerEnrollment,
  assertLessonBelongsToEnrollment,
  assertQuizBelongsToEnrollment,
} from "@/server/modules/learn/learn.policy";
import type {
  GetLearnerCourseInput,
  SubmitQuizAttemptInput,
  UpdateLessonProgressInput,
} from "@/server/modules/learn/learn.schema";
import { assertLearnerAccessEnabled } from "@/server/modules/platform-settings/platform-settings.service";

export async function getLearnerCourses(prisma: PrismaClient, learnerUserId: string) {
  await assertLearnerAccessEnabled(prisma);

  return listLearnerCourses(prisma, learnerUserId);
}

export async function getLearnerCourse(prisma: PrismaClient, learnerUserId: string, input: GetLearnerCourseInput) {
  await assertLearnerAccessEnabled(prisma);

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
  await assertLearnerAccessEnabled(prisma);

  const enrollment = await findLearnerCourseBySlug(prisma, {
    learnerUserId,
    courseSlug: input.courseSlug,
  });
  const activeEnrollment = assertLearnerEnrollment(enrollment, learnerUserId);
  assertLessonBelongsToEnrollment(activeEnrollment, input.lessonId);
  const previousProgress = activeEnrollment.progress.find((progress) => progress.lessonId === input.lessonId);
  const isFirstProgress = activeEnrollment.progress.length === 0 && input.status !== "NOT_STARTED";

  const progress = await upsertLessonProgress(prisma, {
    enrollmentId: activeEnrollment.id,
    lessonId: input.lessonId,
    status: input.status,
  });
  await syncCourseCompletion(prisma, activeEnrollment, input.lessonId, input.status);
  await trackLessonProgressEvents(prisma, activeEnrollment, learnerUserId, input, previousProgress?.status, isFirstProgress);

  return progress;
}

export async function submitQuizAttempt(
  prisma: PrismaClient,
  learnerUserId: string,
  input: SubmitQuizAttemptInput,
) {
  await assertLearnerAccessEnabled(prisma);

  const enrollment = await findLearnerCourseBySlug(prisma, {
    learnerUserId,
    courseSlug: input.courseSlug,
  });
  const activeEnrollment = assertLearnerEnrollment(enrollment, learnerUserId);
  const quiz = assertQuizBelongsToEnrollment(activeEnrollment, await findQuizById(prisma, input.quizId));

  if (quiz.questions.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Quiz belum memiliki pertanyaan.",
    });
  }

  if (quiz.maxAttempts) {
    const submittedAttempts = await countSubmittedQuizAttempts(prisma, activeEnrollment.id, quiz.id);

    if (submittedAttempts >= quiz.maxAttempts) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Batas attempt quiz sudah tercapai.",
      });
    }
  }

  const scoreResult = scoreQuiz(quiz, input.answers);

  const attempt = await createQuizAttempt(prisma, {
    enrollmentId: activeEnrollment.id,
    quizId: quiz.id,
    score: scoreResult.score,
    passed: scoreResult.passed,
    answersJson: JSON.stringify(scoreResult.answers),
  });
  await trackAnalyticsEvent(prisma, {
    userId: activeEnrollment.creatorUserId,
    productId: activeEnrollment.productId,
    type: "QUIZ_SUBMITTED",
    metadata: {
      learnerUserId,
      enrollmentId: activeEnrollment.id,
      quizId: quiz.id,
      attemptId: attempt.id,
      score: scoreResult.score,
      passed: scoreResult.passed,
    },
  }).catch(() => null);

  return attempt;
}

function scoreQuiz(
  quiz: NonNullable<Awaited<ReturnType<typeof findQuizById>>>,
  answers: SubmitQuizAttemptInput["answers"],
) {
  const answersByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]));
  const totalPoints = quiz.questions.reduce((total, question) => total + question.points, 0);
  let earnedPoints = 0;

  const scoredAnswers = quiz.questions.map((question) => {
    const answer = answersByQuestionId.get(question.id);
    const isCorrect = isAnswerCorrect(question, answer);

    if (isCorrect) {
      earnedPoints += question.points;
    }

    return {
      questionId: question.id,
      optionId: answer?.optionId ?? null,
      answerText: answer?.answerText ?? null,
      isCorrect,
      points: isCorrect ? question.points : 0,
      maxPoints: question.points,
    };
  });

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return {
    answers: scoredAnswers,
    score,
    passed: score >= quiz.passingScore,
  };
}

function isAnswerCorrect(
  question: NonNullable<Awaited<ReturnType<typeof findQuizById>>>["questions"][number],
  answer: SubmitQuizAttemptInput["answers"][number] | undefined,
) {
  if (!answer) {
    return false;
  }

  if (question.type === "MULTIPLE_CHOICE") {
    return Boolean(answer.optionId && question.options.some((option) => option.id === answer.optionId && option.isCorrect));
  }

  const submittedAnswer = normalizeTextAnswer(answer.answerText);

  return question.options.some((option) => option.isCorrect && normalizeTextAnswer(option.label) === submittedAnswer);
}

function normalizeTextAnswer(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

async function syncCourseCompletion(
  prisma: PrismaClient,
  enrollment: NonNullable<Awaited<ReturnType<typeof findLearnerCourseBySlug>>>,
  lessonId: string,
  status: UpdateLessonProgressInput["status"],
) {
  const lessonIds = enrollment.product.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));

  if (lessonIds.length === 0) {
    await updateEnrollmentCompletion(prisma, enrollment.id, null);
    return;
  }

  const completedLessonIds = new Set(
    enrollment.progress.filter((progress) => progress.status === "COMPLETED").map((progress) => progress.lessonId),
  );

  if (status === "COMPLETED") {
    completedLessonIds.add(lessonId);
  } else {
    completedLessonIds.delete(lessonId);
  }

  const isCompleted = lessonIds.every((id) => completedLessonIds.has(id));
  const completedAt = isCompleted ? enrollment.completedAt ?? new Date() : null;

  await updateEnrollmentCompletion(prisma, enrollment.id, completedAt);
}

async function trackLessonProgressEvents(
  prisma: PrismaClient,
  enrollment: NonNullable<Awaited<ReturnType<typeof findLearnerCourseBySlug>>>,
  learnerUserId: string,
  input: UpdateLessonProgressInput,
  previousStatus: string | undefined,
  isFirstProgress: boolean,
) {
  if (isFirstProgress) {
    await trackAnalyticsEvent(prisma, {
      userId: enrollment.creatorUserId,
      productId: enrollment.productId,
      type: "COURSE_STARTED",
      metadata: {
        learnerUserId,
        enrollmentId: enrollment.id,
        lessonId: input.lessonId,
      },
    }).catch(() => null);
  }

  if (input.status !== "COMPLETED" || previousStatus === "COMPLETED") {
    return;
  }

  await trackAnalyticsEvent(prisma, {
    userId: enrollment.creatorUserId,
    productId: enrollment.productId,
    type: "LESSON_COMPLETED",
    metadata: {
      learnerUserId,
      enrollmentId: enrollment.id,
      lessonId: input.lessonId,
    },
  }).catch(() => null);
}
