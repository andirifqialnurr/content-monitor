"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CoursePreview } from "@/components/courses/course-preview";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { trpc } from "@/lib/trpc/react";

export function CoursePlayer({ courseSlug }) {
  const utils = trpc.useUtils();
  const course = trpc.learn.get.useQuery({ courseSlug });
  const updateProgressMutation = trpc.learn.updateProgress.useMutation({
    onSuccess: async () => {
      await utils.learn.get.invalidate({ courseSlug });
      await utils.learn.list.invalidate();
    },
  });
  const submitQuizMutation = trpc.learn.submitQuiz.useMutation({
    onSuccess: async () => {
      await utils.learn.get.invalidate({ courseSlug });
      await utils.learn.list.invalidate();
    },
  });

  if (course.isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat course...</p>;
  }

  if (course.error) {
    return <p className="text-sm text-destructive">{course.error.message}</p>;
  }

  const enrollment = course.data;
  const product = enrollment.product;
  const progressByLessonId = Object.fromEntries(enrollment.progress.map((progress) => [progress.lessonId, progress]));

  function handleMarkComplete(lessonId) {
    updateProgressMutation.mutate({
      courseSlug,
      lessonId,
      status: "COMPLETED",
    });
  }

  function handleSubmitQuiz(quizId, answers) {
    submitQuizMutation.mutate({
      courseSlug,
      quizId,
      answers,
    });
  }

  return (
    <div className="grid gap-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-3">
          <Link href="/learn">
            <ArrowLeft className="size-4" />
            Kembali ke My Courses
          </Link>
        </Button>
        <PageHeader
          eyebrow="Learner"
          title={product.title}
          description={product.description ?? "Course player untuk lesson bacaan, video, resource, dan progress belajar."}
          badge={enrollment.status}
        />
      </div>

      {updateProgressMutation.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
          {updateProgressMutation.error.message}
        </p>
      )}
      {submitQuizMutation.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
          {submitQuizMutation.error.message}
        </p>
      )}

      <CoursePreview
        product={product}
        mode="learner"
        progressByLessonId={progressByLessonId}
        quizAttempts={enrollment.quizAttempts}
        onMarkComplete={handleMarkComplete}
        onSubmitQuiz={handleSubmitQuiz}
        isProgressPending={updateProgressMutation.isPending}
        isQuizPending={submitQuizMutation.isPending}
      />
    </div>
  );
}
