import { createTRPCRouter, publicProcedure } from "@/server/trpc/root";
import { getHealthStatus } from "@/server/modules/health/health.service";

export const healthRouter = createTRPCRouter({
  status: publicProcedure.query(() => getHealthStatus()),
});
