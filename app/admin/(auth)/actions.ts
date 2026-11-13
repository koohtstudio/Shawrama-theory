"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isMock, publicEnv, serverEnv } from "@/lib/env";
import { allow, hashKey } from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";

/** Mock mode only: signs in the seeded demo owner. Refuses in live mode. */
export async function demoLogin() {
  if (!isMock) throw new Error("Demo login is disabled in live mode");
  const env = serverEnv();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: env.DEMO_STAFF_EMAIL ?? "",
    password: env.DEMO_STAFF_PASSWORD ?? "",
  });
  if (error) throw new Error("Demo login failed. Did you run `pnpm db:reset`?");
  redirect("/admin");
}

const emailSchema = z.object({ email: z.email().max(120) });

/** Live mode: email a magic link. Existing staff accounts only, and the reply never reveals whether the address is known. */
export async function sendMagicLink(_prev: { message: string } | undefined, form: FormData): Promise<{ message: string }> {
  const parsed = emailSchema.safeParse({ email: String(form.get("email") ?? "").trim().toLowerCase() });
  if (!parsed.success) return { message: "Enter a valid email address." };
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();
  if (!(await allow(`login:ip:${hashKey(ip)}`, 10, 3600)) || !(await allow(`login:email:${hashKey(parsed.data.email)}`, 4, 3600))) {
    return { message: "Too many attempts. Try again later." };
  }
  const supabase = await createClient();
  await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: false, emailRedirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/admin/auth/callback` },
  });
  return { message: "If that address belongs to staff, a sign-in link is on its way." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
