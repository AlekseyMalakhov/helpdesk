import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, APIError } from "better-auth/api";
import prisma from "../prisma/client";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        input: false,
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = ctx.body?.email as string | undefined;
      if (!email) return;
      const user = await prisma.user.findUnique({ where: { email } });
      if (user?.deletedAt) {
        throw new APIError("UNAUTHORIZED", { message: "Invalid email or password." });
      }
    }),
  },
  trustedOrigins: (process.env.TRUSTED_ORIGINS ?? "http://localhost:5173").split(","),
});
