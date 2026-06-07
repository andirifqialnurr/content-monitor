import type { CourseLesson, CourseModule, Product } from "@prisma/client";
import { TRPCError } from "@trpc/server";

type CourseModuleWithProduct = CourseModule & {
  product: Product;
};

type CourseLessonWithModuleProduct = CourseLesson & {
  module: CourseModuleWithProduct;
};

export function assertCourseProductOwner(product: Product | null, userId: string) {
  if (!product) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Course tidak ditemukan.",
    });
  }

  if (product.type !== "COURSE") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Produk ini bukan course.",
    });
  }

  if (product.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Anda tidak punya akses ke course ini.",
    });
  }

  return product;
}

export function assertCourseModuleOwner(module: CourseModuleWithProduct | null, userId: string) {
  if (!module) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Module course tidak ditemukan.",
    });
  }

  assertCourseProductOwner(module.product, userId);

  return module;
}

export function assertCourseLessonOwner(lesson: CourseLessonWithModuleProduct | null, userId: string) {
  if (!lesson) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Lesson course tidak ditemukan.",
    });
  }

  assertCourseModuleOwner(lesson.module, userId);

  return lesson;
}
