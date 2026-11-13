import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const hashKey = (v: string) => createHash("sha256").update(v).digest("hex").slice(0, 24);

/** True while `key` is under `limit` hits per `windowSeconds`. Backed by a SQL token bucket (same in mock and live). */
export async function allow(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("rate_limit_hit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new Error(`rate limit failed: ${error.message}`);
  return data === true;
}
