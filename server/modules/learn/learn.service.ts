import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  countSubmittedQuizAttempts,
  createQuizAttempt,
  findQuizById,
  findLearnerCourseBySlug,
  listLearnerCourses,
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

export async function submitQuizAttempt(
  prisma: PrismaClient,
  learnerUserId: string,
  input: SubmitQuizAttemptInput,
) {
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

  return createQuizAttempt(prisma, {
    enrollmentId: activeEnrollment.id,
    quizId: quiz.id,
    score: scoreResult.score,
    passed: scoreResult.passed,
    answersJson: JSON.stringify(scoreResult.answers),
  });
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
