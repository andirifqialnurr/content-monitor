"use client";

import {
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  HelpCircle,
  ListChecks,
  PlayCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const lessonTypeLabels = {
  READING: "Reading",
  VIDEO: "Video",
};

const resourceTypeLabels = {
  TOOL: "Tool",
  OFFICIAL_DOC: "Official doc",
  SOURCE: "Source",
  REPOSITORY: "Repository",
  FILE: "File",
};

export function CoursePreview({
  product,
  mode = "creator",
  progressByLessonId = {},
  onMarkComplete,
  isProgressPending = false,
}) {
  const modules = product.modules ?? [];
  const lessons = useMemo(
    () => modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title }))),
    [modules],
  );
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id ?? "");
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? null;
  const selectedModule = selectedLesson ? modules.find((module) => module.id === selectedLesson.moduleId) : null;
  const selectedProgress = selectedLesson ? progressByLessonId[selectedLesson.id] : null;
  const completedLessons = lessons.filter((lesson) => progressByLessonId[lesson.id]?.status === "COMPLETED").length;
  const progressPercent = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;
  const totalMinutes = lessons.reduce((total, lesson) => total + (lesson.duration ?? 0), 0);
  const courseQuizCount = getCourseQuizzes(product).length;

  useEffect(() => {
    if (!lessons.length) {
      setSelectedLessonId("");
      return;
    }

    if (!selectedLessonId || !lessons.some((lesson) => lesson.id === selectedLessonId)) {
      setSelectedLessonId(lessons[0].id);
    }
  }, [lessons, selectedLessonId]);

  if (modules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardDescription>Course preview</CardDescription>
          <CardTitle className="text-lg">Belum Ada Module</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tambahkan module dan lesson di builder agar preview course bisa ditampilkan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="grid gap-4">
        <Card>
          <CardHeader>
            <CardDescription>{mode === "learner" ? "Progress belajar" : "Ringkasan course"}</CardDescription>
            <CardTitle className="text-lg">{product.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <SummaryStat label="Module" value={modules.length} />
              <SummaryStat label="Lesson" value={lessons.length} />
              <SummaryStat label="Quiz" value={courseQuizCount} />
            </div>
            {totalMinutes > 0 && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" />
                {totalMinutes} menit estimasi
              </p>
            )}
            {mode === "learner" && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{completedLessons} lesson selesai</span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Module dan lesson</CardDescription>
            <CardTitle className="text-lg">Daftar Materi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {modules.map((module) => (
              <section key={module.id} className="grid gap-2">
                <h3 className="text-sm font-semibold">{module.title}</h3>
                <div className="grid gap-2">
                  {module.lessons.map((lesson) => {
                    const progress = progressByLessonId[lesson.id];
                    const completed = progress?.status === "COMPLETED";

                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        className={cn(
                          "grid gap-1 rounded-md border px-3 py-2 text-left text-sm transition hover:bg-muted/60",
                          selectedLessonId === lesson.id ? "border-primary bg-primary/5" : "bg-muted/20",
                        )}
                        onClick={() => setSelectedLessonId(lesson.id)}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {lesson.type === "VIDEO" ? (
                            <PlayCircle className="size-4 shrink-0" />
                          ) : (
                            <BookOpen className="size-4 shrink-0" />
                          )}
                          <span className="truncate font-medium">{lesson.title}</span>
                          {completed && <CheckCircle2 className="ml-auto size-4 shrink-0 text-emerald-600" />}
                        </span>
                        <span className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                          <span>{lessonTypeLabels[lesson.type] ?? lesson.type}</span>
                          {lesson.duration ? <span>{lesson.duration} menit</span> : null}
                          {lesson.isPreview ? <span>Preview</span> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </CardContent>
        </Card>
      </aside>

      <main className="grid gap-4">
        <Card>
          <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardDescription>{selectedLesson?.moduleTitle ?? "Lesson"}</CardDescription>
              <CardTitle className="text-xl">{selectedLesson?.title ?? "Pilih lesson"}</CardTitle>
            </div>
            {selectedLesson && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{lessonTypeLabels[selectedLesson.type] ?? selectedLesson.type}</Badge>
                {selectedLesson.duration ? <Badge variant="outline">{selectedLesson.duration} menit</Badge> : null}
                {selectedLesson.isPreview ? <Badge variant="outline">Preview publik</Badge> : null}
              </div>
            )}
          </CardHeader>
          <CardContent className="grid gap-4">
            {selectedLesson ? (
              <>
                <LessonContent lesson={selectedLesson} />

                {mode === "learner" && (
                  <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 p-3">
                    <Badge variant={selectedProgress?.status === "COMPLETED" ? "secondary" : "outline"}>
                      {formatProgressStatus(selectedProgress?.status)}
                    </Badge>
                    <Button
                      type="button"
                      onClick={() => onMarkComplete?.(selectedLesson.id)}
                      disabled={isProgressPending || selectedProgress?.status === "COMPLETED"}
                    >
                      <CheckCircle2 className="size-4" />
                      Tandai selesai
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Pilih lesson dari sidebar untuk melihat materi.</p>
            )}
          </CardContent>
        </Card>

        {selectedLesson && <LessonResources lesson={selectedLesson} />}
        <QuizSummary product={product} module={selectedModule} lesson={selectedLesson} />
      </main>
    </div>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-md border bg-muted/20 p-2">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function LessonContent({ lesson }) {
  if (lesson.type === "VIDEO") {
    return <VideoLesson lesson={lesson} />;
  }

  return (
    <div className="grid gap-3">
      {lesson.body ? (
        <div className="whitespace-pre-wrap rounded-md border bg-background p-4 text-sm leading-relaxed">
          {lesson.body}
        </div>
      ) : (
        <p className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
          Materi bacaan belum diisi.
        </p>
      )}
      {lesson.contentUrl && (
        <Button asChild variant="outline" className="w-fit">
          <a href={lesson.contentUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
            Buka materi tambahan
          </a>
        </Button>
      )}
    </div>
  );
}

function VideoLesson({ lesson }) {
  const previewUrl = getEmbeddableVideoUrl(lesson.videoUrl);

  if (!previewUrl && !lesson.videoUrl) {
    return (
      <p className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
        Video belum diisi.
      </p>
    );
  }

  if (!previewUrl) {
    return (
      <Button asChild variant="outline" className="w-fit">
        <a href={lesson.videoUrl} target="_blank" rel="noreferrer">
          <ExternalLink className="size-4" />
          Buka video
        </a>
      </Button>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-muted/20">
      <iframe
        src={previewUrl}
        title={`Video ${lesson.title}`}
        className="aspect-video w-full bg-background"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

function LessonResources({ lesson }) {
  const resources = lesson.resources ?? [];

  return (
    <Card>
      <CardHeader>
        <CardDescription>Resource lesson</CardDescription>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="size-4 text-muted-foreground" />
          Tools dan Dokumentasi
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {resources.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada resource untuk lesson ini.</p>
        ) : (
          resources.map((resource) => (
            <article key={resource.id} className="grid gap-2 rounded-md border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{resourceTypeLabels[resource.type] ?? resource.type}</Badge>
                <h3 className="font-medium">{resource.name}</h3>
              </div>
              {resource.description && <p className="text-sm text-muted-foreground">{resource.description}</p>}
              {resource.url && (
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <a href={resource.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    Buka resource
                  </a>
                </Button>
              )}
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function QuizSummary({ product, module, lesson }) {
  const quizzes = [
    ...(product.quizzes ?? []).map((quiz) => ({ ...quiz, scope: "Course" })),
    ...(module?.quizzes ?? []).map((quiz) => ({ ...quiz, scope: module.title })),
    ...(lesson?.quizzes ?? []).map((quiz) => ({ ...quiz, scope: lesson.title })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardDescription>Evaluasi</CardDescription>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListChecks className="size-4 text-muted-foreground" />
          Quiz
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {quizzes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada quiz untuk course/module/lesson ini.</p>
        ) : (
          quizzes.map((quiz) => (
            <article key={quiz.id} className="grid gap-2 rounded-md border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{quiz.scope}</Badge>
                <h3 className="font-medium">{quiz.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{quiz.questions?.length ?? 0} pertanyaan</span>
                <span>Passing score {quiz.passingScore}</span>
                <span>{quiz.maxAttempts ? `${quiz.maxAttempts} attempt` : "Attempt bebas"}</span>
              </div>
              {(quiz.questions ?? []).slice(0, 3).map((question) => (
                <p key={question.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <HelpCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{question.prompt}</span>
                </p>
              ))}
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function getCourseQuizzes(product) {
  return [
    ...(product.quizzes ?? []),
    ...(product.modules ?? []).flatMap((module) => [
      ...(module.quizzes ?? []),
      ...(module.lessons ?? []).flatMap((lesson) => lesson.quizzes ?? []),
    ]),
  ];
}

function formatProgressStatus(status) {
  if (status === "COMPLETED") {
    return "Selesai";
  }

  if (status === "IN_PROGRESS") {
    return "Sedang belajar";
  }

  return "Belum mulai";
}

function getEmbeddableVideoUrl(value) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url.toString();
    }

    return url.toString();
  } catch {
    return null;
  }
}
