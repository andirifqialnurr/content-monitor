"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Clock, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { trpc } from "@/lib/trpc/react";

export function LearnDashboard() {
  const enrollments = trpc.learn.list.useQuery();

  if (enrollments.isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat course...</p>;
  }

  if (enrollments.error) {
    return <p className="text-sm text-destructive">{enrollments.error.message}</p>;
  }

  const items = enrollments.data ?? [];

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Learner"
        title="My Courses"
        description="Daftar course aktif dari enrollment yang sudah dimiliki akun ini."
      />

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardDescription>Learner area</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpenCheck className="size-4 text-muted-foreground" />
              Belum Ada Course
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Course akan muncul setelah enrollment aktif dibuat dari payment atau proses admin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((enrollment) => (
            <CourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({ enrollment }) {
  const product = enrollment.product;
  const lessons = getLessons(product);
  const completedLessons = lessons.filter((lesson) =>
    enrollment.progress.some((progress) => progress.lessonId === lesson.id && progress.status === "COMPLETED"),
  ).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;
  const totalMinutes = lessons.reduce((total, lesson) => total + (lesson.duration ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardDescription>{product.user?.name ?? product.user?.username ?? "Creator"}</CardDescription>
        <CardTitle className="line-clamp-2 text-lg">{product.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {product.description && <p className="line-clamp-3 text-sm text-muted-foreground">{product.description}</p>}

        <div className="grid grid-cols-3 gap-2 text-center">
          <SummaryItem label="Module" value={product.modules.length} />
          <SummaryItem label="Lesson" value={lessons.length} />
          <SummaryItem label="Selesai" value={completedLessons} />
        </div>

        {totalMinutes > 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {totalMinutes} menit estimasi
          </p>
        )}

        <div className="grid gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{enrollment.status}</Badge>
          <Badge variant="outline">Mulai {formatDate(enrollment.startedAt)}</Badge>
        </div>

        <Button asChild>
          <Link href={`/learn/${product.slug}`}>
            <GraduationCap className="size-4" />
            Lanjut belajar
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-md border bg-muted/20 p-2">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function getLessons(product) {
  return product.modules.flatMap((module) => module.lessons);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
