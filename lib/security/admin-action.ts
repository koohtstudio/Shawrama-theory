import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type Staff = { supabase: SupabaseClient<Database>; user: User; role: "owner" | "staff" };
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

/** Verifies the session with Supabase (getUser, never getSession) and the role in `profiles`. */
export async function requireStaff(): Promise<Staff | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", data.user.id).maybeSingle();
  if (!profile) return null;
  return { supabase, user: data.user, role: profile.role };
}

/**
 * Every admin mutation goes through this: Zod-parse, then re-check the user is owner/staff,
 * then run. The handler runs with the staff member's own client, so RLS applies on top.
 */
export function adminAction<S extends z.ZodType, R = undefined>(
  schema: S,
  handler: (staff: Staff, input: z.output<S>) => Promise<R>,
  opts: { ownerOnly?: boolean } = {},
) {
  return async (raw: z.input<S>): Promise<ActionResult<R>> => {
    const staff = await requireStaff();
    if (!staff || (opts.ownerOnly && staff.role !== "owner")) return { ok: false, error: "Not authorised" };
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Check the highlighted fields", fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
    }
    try {
      return { ok: true, data: await handler(staff, parsed.data) };
    } catch (e) {
      console.error("admin action failed", e);
      return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
    }
  };
}
