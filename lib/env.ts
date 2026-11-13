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
