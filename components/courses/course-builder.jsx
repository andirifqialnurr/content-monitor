"use client";

import { BookOpen, FileText, ListTree, Plus, Save, Trash2, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/react";

const lessonTypeOptions = [
  { value: "READING", label: "Reading" },
  { value: "VIDEO", label: "Video" },
];

const lessonTypeLabels = Object.fromEntries(lessonTypeOptions.map((type) => [type.value, type.label]));

export function CourseBuilder({ product }) {
  const utils = trpc.useUtils();
  const modules = product.modules ?? [];
  const lessons = useMemo(
    () => modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title }))),
    [modules],
  );
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id ?? "");
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? null;
  const [draftType, setDraftType] = useState(selectedLesson?.type ?? "READING");

  async function refreshProduct() {
    await utils.products.get.invalidate({ id: product.id });
    await utils.products.list.invalidate();
  }

  const createModuleMutation = trpc.courses.createModule.useMutation({ onSuccess: refreshProduct });
  const updateModuleMutation = trpc.courses.updateModule.useMutation({ onSuccess: refreshProduct });
  const deleteModuleMutation = trpc.courses.deleteModule.useMutation({ onSuccess: refreshProduct });
  const createLessonMutation = trpc.courses.createLesson.useMutation({ onSuccess: refreshProduct });
  const updateLessonMutation = trpc.courses.updateLesson.useMutation({ onSuccess: refreshProduct });
  const deleteLessonMutation = trpc.courses.deleteLesson.useMutation({ onSuccess: refreshProduct });

  useEffect(() => {
    if (!lessons.length) {
      setSelectedLessonId("");
      return;
    }

    if (!selectedLessonId || !lessons.some((lesson) => lesson.id === selectedLessonId)) {
      setSelectedLessonId(lessons[0].id);
    }
  }, [lessons, selectedLessonId]);

  useEffect(() => {
    if (selectedLesson) {
      setDraftType(selectedLesson.type);
    }
  }, [selectedLesson]);

  function handleCreateModule(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    createModuleMutation.mutate(
      {
        productId: product.id,
        title: String(formData.get("title") ?? ""),
      },
      {
        onSuccess: () => form.reset(),
      },
    );
  }

  function handleUpdateModule(event, moduleId) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    updateModuleMutation.mutate({
      id: moduleId,
      title: String(formData.get("title") ?? ""),
    });
  }

  function handleCreateLesson(event, moduleId) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    createLessonMutation.mutate(
      {
        moduleId,
        title: String(formData.get("title") ?? ""),
        type: String(formData.get("type") ?? "READING"),
      },
      {
        onSuccess: (lesson) => {
          form.reset();
          setSelectedLessonId(lesson.id);
        },
      },
    );
  }

  function handleUpdateLesson(event) {
    event.preventDefault();

    if (!selectedLesson) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const durationValue = String(formData.get("duration") ?? "").trim();

    updateLessonMutation.mutate({
      id: selectedLesson.id,
      title: String(formData.get("title") ?? ""),
      type: draftType,
      body: draftType === "READING" ? String(formData.get("body") ?? "") : "",
      contentUrl: draftType === "READING" ? String(formData.get("contentUrl") ?? "") : "",
      videoUrl: draftType === "VIDEO" ? String(formData.get("videoUrl") ?? "") : "",
      duration: durationValue ? Number(durationValue) : null,
      isPreview: formData.get("isPreview") === "on",
    });
  }

  function handleDeleteLesson() {
    if (!selectedLesson || !window.confirm(`Hapus lesson ${selectedLesson.title}?`)) {
      return;
    }

    deleteLessonMutation.mutate(
      { id: selectedLesson.id },
      {
        onSuccess: () => {
          setSelectedLessonId("");
        },
      },
    );
  }

  const mutationError =
    createModuleMutation.error ??
    updateModuleMutation.error ??
    deleteModuleMutation.error ??
    createLessonMutation.error ??
    updateLessonMutation.error ??
    deleteLessonMutation.error;

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardDescription>Course builder</CardDescription>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListTree className="size-4 text-muted-foreground" />
            Struktur Course
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="grid gap-2 rounded-md border bg-muted/20 p-3" onSubmit={handleCreateModule}>
            <Input name="title" placeholder="Nama module" required />
            <Button type="submit" disabled={createModuleMutation.isPending}>
              <Plus className="size-4" />
              Tambah Module
            </Button>
          </form>

          {modules.length === 0 && <p className="text-sm text-muted-foreground">Belum ada module.</p>}

          <div className="grid gap-3">
            {modules.map((module) => (
              <article key={module.id} className="grid gap-3 rounded-md border bg-background p-3">
                <form className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2" onSubmit={(event) => handleUpdateModule(event, module.id)}>
                  <Input name="title" defaultValue={module.title} aria-label="Nama module" required />
                  <Button type="submit" size="icon" variant="outline" aria-label={`Simpan ${module.title}`}>
                    <Save className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={`Hapus ${module.title}`}
                    onClick={() => {
                      if (window.confirm(`Hapus module ${module.title}? Semua lesson di dalamnya ikut terhapus.`)) {
                        deleteModuleMutation.mutate({ id: module.id });
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </form>

                <div className="grid gap-2">
                  {module.lessons.length === 0 && <p className="text-xs text-muted-foreground">Belum ada lesson.</p>}
                  {module.lessons.map((lesson) => (
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
                        {lesson.type === "VIDEO" ? <Video className="size-4 shrink-0" /> : <BookOpen className="size-4 shrink-0" />}
                        <span className="truncate font-medium">{lesson.title}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{lessonTypeLabels[lesson.type] ?? lesson.type}</span>
                    </button>
                  ))}
                </div>

                <form className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_auto]" onSubmit={(event) => handleCreateLesson(event, module.id)}>
                  <Input name="title" placeholder="Lesson baru" required />
                  <select name="type" className="h-10 rounded-md border border-input bg-background px-3 text-sm" defaultValue="READING">
                    {lessonTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" disabled={createLessonMutation.isPending}>
                    <Plus className="size-4" />
                    Lesson
                  </Button>
                </form>
              </article>
            ))}
          </div>

          {mutationError && <p className="text-sm text-destructive">{mutationError.message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Lesson editor</CardDescription>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="size-4 text-muted-foreground" />
            Materi Lesson
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedLesson ? (
            <form key={selectedLesson.id} className="grid gap-3" onSubmit={handleUpdateLesson}>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_120px]">
                <Input name="title" defaultValue={selectedLesson.title} placeholder="Judul lesson" required />
                <select
                  name="type"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={draftType}
                  onChange={(event) => setDraftType(event.target.value)}
                >
                  {lessonTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Input name="duration" min="0" step="1" type="number" defaultValue={selectedLesson.duration ?? ""} placeholder="Menit" />
              </div>

              {draftType === "READING" ? (
                <>
                  <textarea
                    name="body"
                    defaultValue={selectedLesson.body ?? ""}
                    placeholder="Tulis materi bacaan lesson"
                    className="min-h-[320px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <Input name="contentUrl" defaultValue={selectedLesson.contentUrl ?? ""} placeholder="URL file/materi tambahan" />
                </>
              ) : (
                <>
                  <Input name="videoUrl" defaultValue={selectedLesson.videoUrl ?? ""} placeholder="Video URL atau embed URL" />
                  <VideoPreview url={selectedLesson.videoUrl} title={selectedLesson.title} />
                </>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input name="isPreview" type="checkbox" defaultChecked={selectedLesson.isPreview} className="size-4 rounded border-input" />
                Bisa dipreview publik
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={updateLessonMutation.isPending}>
                  <Save className="size-4" />
                  Simpan Lesson
                </Button>
                <Button type="button" variant="outline" onClick={handleDeleteLesson} disabled={deleteLessonMutation.isPending}>
                  <Trash2 className="size-4" />
                  Hapus Lesson
                </Button>
                <Badge variant="secondary">{selectedLesson.moduleTitle}</Badge>
                <Badge variant="outline">{lessonTypeLabels[selectedLesson.type] ?? selectedLesson.type}</Badge>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">Pilih atau tambahkan lesson untuk mulai mengisi materi.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VideoPreview({ url, title }) {
  const previewUrl = getEmbeddableVideoUrl(url);

  if (!previewUrl) {
    return <p className="text-sm text-muted-foreground">Video preview muncul setelah URL video disimpan.</p>;
  }

  return (
    <div className="overflow-hidden rounded-md border bg-muted/20">
      <iframe
        src={previewUrl}
        title={`Preview ${title}`}
        className="aspect-video w-full bg-background"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
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
