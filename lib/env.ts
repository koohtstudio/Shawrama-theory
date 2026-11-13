import { z } from "zod";

// NEXT_PUBLIC_* values must be referenced literally so Next can inline them into the browser bundle.
const publicSchema = z.object({
  NEXT_PUBLIC_APP_MODE: z.enum(["mock", "live"]).default("mock"),
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_APP_MODE: process.env.NEXT_PUBLIC_APP_MODE,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
});

export const isMock = publicEnv.NEXT_PUBLIC_APP_MODE === "mock";
export const isLive = !isMock;

const serverSchema = z
  .object({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
    ORDER_TOKEN_SECRET: z.string().min(32),
    DEMO_STAFF_EMAIL: z.string().optional(),
    DEMO_STAFF_PASSWORD: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_FROM: z.string().optional(),
    TURNSTILE_SECRET_KEY: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (!isLive) return;
    for (const k of [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "RESEND_API_KEY",
      "EMAIL_FROM",
      "TURNSTILE_SECRET_KEY",
    ] as const) {
      if (!v[k]) ctx.addIssue({ code: "custom", path: [k], message: `${k} is required in live mode` });
    }
    if (!publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_TURNSTILE_SITE_KEY"],
        message: "NEXT_PUBLIC_TURNSTILE_SITE_KEY is required in live mode",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverSchema>;
let cached: ServerEnv | undefined;

/** Server-only secrets. Throws on the server if something is missing; never import from client code. */
export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") throw new Error("serverEnv() called in the browser");
  return (cached ??= serverSchema.parse(process.env));
}
