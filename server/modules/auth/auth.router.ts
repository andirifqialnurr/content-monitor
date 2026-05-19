import { createTRPCRouter, publicProcedure } from "@/server/trpc/root";
import { registerInputSchema } from "@/server/modules/auth/auth.schema";
import { registerUser } from "@/server/modules/auth/auth.service";

export const authRouter = createTRPCRouter({
  register: publicProcedure.input(registerInputSchema).mutation(({ ctx, input }) =>
    registerUser(ctx.prisma, input),
  ),
});
