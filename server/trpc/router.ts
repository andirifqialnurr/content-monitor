import { createTRPCRouter } from "@/server/trpc/root";
import { authRouter } from "@/server/modules/auth/auth.router";
import { contentItemsRouter } from "@/server/modules/content-items/content-items.router";
import { healthRouter } from "@/server/modules/health/health.router";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  contentItems: contentItemsRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = appRouter.createCaller;
