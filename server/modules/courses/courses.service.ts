import type { PrismaClient } from "@prisma/client";
import {
  createCourseLesson,
  createCourseModule,
  deleteCourseLesson,
  deleteCourseModule,
  findCourseLessonById,
  findCourseModuleById,
  findCourseProductById,
  getNextCourseLessonOrder,
  getNextCourseModuleOrder,
  updateCourseLesson,
  updateCourseModule,
} from "@/server/modules/courses/courses.repository";
import {
  assertCourseLessonOwner,
  assertCourseModuleOwner,
  assertCourseProductOwner,
} from "@/server/modules/courses/courses.policy";
import type {
  CreateCourseLessonInput,
  CreateCourseModuleInput,
  DeleteCourseLessonInput,
  DeleteCourseModuleInput,
  UpdateCourseLessonInput,
  UpdateCourseModuleInput,
} from "@/server/modules/courses/courses.schema";

export async function addCourseModule(prisma: PrismaClient, userId: string, input: CreateCourseModuleInput) {
  const product = await findCourseProductById(prisma, input.productId);
  assertCourseProductOwner(product, userId);

  const order = await getNextCourseModuleOrder(prisma, input.productId);

  return createCourseModule(prisma, {
    productId: input.productId,
    title: input.title,
    order,
  });
}

export async function editCourseModule(prisma: PrismaClient, userId: string, input: UpdateCourseModuleInput) {
  const module = await findCourseModuleById(prisma, input.id);
  assertCourseModuleOwner(module, userId);

  return updateCourseModule(prisma, {
    id: input.id,
    title: input.title,
  });
}

export async function removeCourseModule(prisma: PrismaClient, userId: string, input: DeleteCourseModuleInput) {
  const module = await findCourseModuleById(prisma, input.id);
  assertCourseModuleOwner(module, userId);

  await deleteCourseModule(prisma, input.id);

  return { id: input.id };
}

export async function addCourseLesson(prisma: PrismaClient, userId: string, input: CreateCourseLessonInput) {
  const module = await findCourseModuleById(prisma, input.moduleId);
  assertCourseModuleOwner(module, userId);

  const order = await getNextCourseLessonOrder(prisma, input.moduleId);

  return createCourseLesson(prisma, {
    moduleId: input.moduleId,
    title: input.title,
    type: input.type,
    order,
  });
}

export async function editCourseLesson(prisma: PrismaClient, userId: string, input: UpdateCourseLessonInput) {
  const lesson = await findCourseLessonById(prisma, input.id);
  assertCourseLessonOwner(lesson, userId);

  return updateCourseLesson(prisma, {
    id: input.id,
    title: input.title,
    type: input.type,
    body: input.body,
    contentUrl: input.contentUrl,
    videoUrl: input.videoUrl,
    duration: input.duration,
    isPreview: input.isPreview,
  });
}

export async function removeCourseLesson(prisma: PrismaClient, userId: string, input: DeleteCourseLessonInput) {
  const lesson = await findCourseLessonById(prisma, input.id);
  assertCourseLessonOwner(lesson, userId);

  await deleteCourseLesson(prisma, input.id);

  return { id: input.id };
}
