import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { customSession } from "better-auth/plugins/custom-session";
import { eq } from "drizzle-orm";
import { authDb } from "@/db/client";
import { user, session, account, verification, chapters } from "@/db/schema";
import { sendEmail } from "./mailer";
import { logger } from "./observability/logger";

function createAuth() {
  return betterAuth({
    appName: "Homebrew",
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

    database: drizzleAdapter(authDb, {
      provider: "pg",
      schema: { user, session, account, verification },
    }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 12,
      maxPasswordLength: 256,
      sendResetPassword: async ({ user: u, url }) => {
        await sendEmail({
          to: u.email,
          subject: "Reset your Homebrew password",
          body: `Someone asked to reset the password for this account.\n\n${url}\n\nIf that wasn't you, ignore this email — nothing has changed.`,
        });
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user: u, url }) => {
        await sendEmail({
          to: u.email,
          subject: "Confirm your Homebrew address",
          body: `Welcome to Homebrew. Confirm your address to finish signing up:\n\n${url}`,
        });
      },
    },

    user: {
      additionalFields: {
        chapterId: { type: "string", required: true, input: true },
        unitsPreference: { type: "string", required: false, input: false, defaultValue: "us" },
        termsAcceptedAt: { type: "date", required: false, input: false },
      },
    },

    databaseHooks: {
      session: {
        create: {
          after: async (created) => {
            logger.info("login", { userId: created.userId });
            const { auditLog } = await import("@/db/schema");
            await authDb.insert(auditLog).values({
              userId: created.userId,
              action: "login",
            });
          },
        },
      },
      user: {
        create: {
          before: async (newUser) => {
            const chapterId = (newUser as { chapterId?: unknown }).chapterId;

            if (typeof chapterId !== "string" || chapterId.length === 0) {
              throw new Error("A homebrew chapter must be selected to sign up.");
            }

            const found = await authDb
              .select({ id: chapters.id })
              .from(chapters)
              .where(eq(chapters.id, chapterId))
              .limit(1);

            if (found.length === 0) {
              throw new Error("That homebrew chapter does not exist.");
            }

            return { data: { ...newUser, termsAcceptedAt: new Date() } };
          },
          after: async (created) => {
            logger.info("signup", { userId: created.id, chapterId: created.chapterId });
            await authDb.insert((await import("@/db/schema")).auditLog).values({
              userId: created.id,
              action: "signup",
              detail: { chapterId: created.chapterId },
            });
            await authDb.insert((await import("@/db/schema")).auditLog).values({
              userId: created.id,
              action: "consent_granted",
            });
          },
        },
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },

    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 300, max: 3 },
        "/forget-password": { window: 300, max: 3 },
      },
    },

    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
      },
    },

    plugins: [
      customSession(async ({ user: u, session: s }) => {
        const row = await authDb
          .select({
            chapterId: user.chapterId,
            unitsPreference: user.unitsPreference,
          })
          .from(user)
          .where(eq(user.id, u.id))
          .limit(1);

        return {
          user: { ...u, ...(row[0] ?? {}) },
          session: s,
        };
      }),
      nextCookies(),
    ],
  });
}

let instance: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  return (instance ??= createAuth());
}

export type Auth = ReturnType<typeof createAuth>;
