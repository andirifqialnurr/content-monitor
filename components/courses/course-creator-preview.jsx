"use client";

import Link from "next/link";
import { ArrowLeft, Edit3 } from "lucide-react";
import { CoursePreview } from "@/components/courses/course-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { trpc } from "@/lib/trpc/react";

export function CourseCreatorPreview({ productId }) {
  const product = trpc.products.get.useQuery({ id: productId });

  if (product.isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat preview course...</p>;
  }

  if (product.error) {
    return <p className="text-sm text-destructive">{product.error.message}</p>;
  }

  const data = product.data;

  if (data.type !== "COURSE") {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Produk ini bukan course dan tidak bisa dibuka sebagai preview course.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-3">
          <Link href={`/produk/course/${data.id}`}>
            <ArrowLeft className="size-4" />
            Kembali ke builder
          </Link>
        </Button>
        <PageHeader
          eyebrow="Produk / Course"
          title={`Preview: ${data.title}`}
          description="Tampilan read-only untuk mengecek susunan module, materi lesson, video, resource, dan quiz sebelum course dipublikasikan."
          badge={data.status}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={`/produk/course/${data.id}`}>
            <Edit3 className="size-4" />
            Edit course
          </Link>
        </Button>
      </div>

      <CoursePreview product={data} mode="creator" />
    </div>
  );
}
