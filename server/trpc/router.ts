import { createTRPCRouter } from "@/server/trpc/root";
import { authRouter } from "@/server/modules/auth/auth.router";
import { contentItemsRouter } from "@/server/modules/content-items/content-items.router";
import { coursesRouter } from "@/server/modules/courses/courses.router";
import { healthRouter } from "@/server/modules/health/health.router";
import { learnRouter } from "@/server/modules/learn/learn.router";
import { productsRouter } from "@/server/modules/products/products.router";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  contentItems: contentItemsRouter,
  courses: coursesRouter,
  health: healthRouter,
  learn: learnRouter,
  products: productsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = appRouter.createCaller;
