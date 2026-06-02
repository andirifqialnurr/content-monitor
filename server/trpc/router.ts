import { createTRPCRouter } from "@/server/trpc/root";
import { accountRouter } from "@/server/modules/account/account.router";
import { adminRouter } from "@/server/modules/admin/admin.router";
import { appearanceRouter } from "@/server/modules/appearance/appearance.router";
import { authRouter } from "@/server/modules/auth/auth.router";
import { contentItemsRouter } from "@/server/modules/content-items/content-items.router";
import { coursesRouter } from "@/server/modules/courses/courses.router";
import { healthRouter } from "@/server/modules/health/health.router";
import { learnRouter } from "@/server/modules/learn/learn.router";
import { paymentsRouter } from "@/server/modules/payments/payments.router";
import { productsRouter } from "@/server/modules/products/products.router";

export const appRouter = createTRPCRouter({
  account: accountRouter,
  admin: adminRouter,
  appearance: appearanceRouter,
  auth: authRouter,
  contentItems: contentItemsRouter,
  courses: coursesRouter,
  health: healthRouter,
  learn: learnRouter,
  payments: paymentsRouter,
  products: productsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = appRouter.createCaller;
