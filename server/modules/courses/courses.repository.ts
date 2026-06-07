import type { CourseLessonType, PrismaClient } from "@prisma/client";

type CreateCourseModuleParams = {
  productId: string;
  title: string;
  order: number;
};

type UpdateCourseModuleParams = {
  id: string;
  title: string;
};

type CreateCourseLessonParams = {
  moduleId: string;
  title: string;
  type: CourseLessonType;
  order: number;
};

type UpdateCourseLessonParams = {
  id: string;
  title?: string;
  type?: CourseLessonType;
  body?: string | null;
  contentUrl?: string | null;
  videoUrl?: string | null;
  duration?: number | null;
  isPreview?: boolean;
};

export function findCourseProductById(prisma: PrismaClient, productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
  });
}

export function findCourseModuleById(prisma: PrismaClient, moduleId: string) {
  return prisma.courseModule.findUnique({
    where: { id: moduleId },
    include: {
      product: true,
    },
  });
}

export function findCourseLessonById(prisma: PrismaClient, lessonId: string) {
  return prisma.courseLesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function getNextCourseModuleOrder(prisma: PrismaClient, productId: string) {
  const result = await prisma.courseModule.aggregate({
    where: { productId },
    _max: { order: true },
  });

  return (result._max.order ?? 0) + 1;
}

export async function getNextCourseLessonOrder(prisma: PrismaClient, moduleId: string) {
  const result = await prisma.courseLesson.aggregate({
    where: { moduleId },
    _max: { order: true },
  });

  return (result._max.order ?? 0) + 1;
}

export function createCourseModule(prisma: PrismaClient, params: CreateCourseModuleParams) {
  return prisma.courseModule.create({
    data: params,
  });
}

export function updateCourseModule(prisma: PrismaClient, params: UpdateCourseModuleParams) {
  const { id, ...data } = params;

  return prisma.courseModule.update({
    where: { id },
    data,
  });
}

export function deleteCourseModule(prisma: PrismaClient, moduleId: string) {
  return prisma.courseModule.delete({
    where: { id: moduleId },
  });
}

export function createCourseLesson(prisma: PrismaClient, params: CreateCourseLessonParams) {
  return prisma.courseLesson.create({
    data: params,
  });
}

export function updateCourseLesson(prisma: PrismaClient, params: UpdateCourseLessonParams) {
  const { id, ...data } = params;

  return prisma.courseLesson.update({
    where: { id },
    data,
  });
}

export function deleteCourseLesson(prisma: PrismaClient, lessonId: string) {
  return prisma.courseLesson.delete({
    where: { id: lessonId },
  });
}
