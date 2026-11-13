// Proves, over the real HTTP API, what an anonymous visitor and a signed-in non-staff user can and cannot do.
// Needs the local stack running (`pnpm db:start`) and the demo data (`pnpm db:reset`).
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
let failed = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ${detail}`}`);
  if (!ok) failed++;
};

async function main() {
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const admin = createClient(url, service, { auth: { persistSession: false } });

  // Reads that must be empty or denied
  for (const t of ["orders", "order_items", "order_item_modifiers", "customers", "notifications_log", "message_templates", "profiles", "webhook_events", "rate_limits"] as const) {
    const r = await anon.from(t).select("*").limit(1);
    check(`anon cannot read ${t}`, !!r.error || (r.data?.length ?? 0) === 0, JSON.stringify(r.data));
  }

  // Public reads that must work
  const items = await anon.from("menu_items").select("id, name, price_cents, published");
  check("anon can read menu items", !items.error && (items.data?.length ?? 0) > 0);
  check("anon only sees published items", (items.data ?? []).every((i) => i.published));
  check("anon can read store settings", !(await anon.from("store_settings").select("*").single()).error);

  // Writes that must fail
  const target = items.data![0]!;
  const upd = await anon.from("menu_items").update({ price_cents: 1 }).eq("id", target.id).select();
  check("anon cannot change a price", !!upd.error || (upd.data?.length ?? 0) === 0);
  const after = await admin.from("menu_items").select("price_cents").eq("id", target.id).single();
  check("price is unchanged afterwards", after.data?.price_cents === target.price_cents);
  check("anon cannot pause ordering", !!(await anon.from("store_settings").update({ ordering_paused: true }).eq("id", true).select()).error);
  check("anon cannot insert an order", !!(await anon.from("orders").insert({ idempotency_key: "x".repeat(20), customer_id: crypto.randomUUID(), pickup_at: new Date().toISOString() })).error);
  check("anon cannot delete menu items", !!(await anon.from("menu_items").delete().eq("id", target.id)).error || (await admin.from("menu_items").select("id").eq("id", target.id)).data?.length === 1);
  check("anon cannot call create_order", !!(await anon.rpc("create_order", { p_idempotency_key: "k".repeat(20), p_name: "x", p_phone: "1", p_email: "", p_pickup_at: new Date().toISOString(), p_asap: true, p_notes: "", p_lines: [] })).error);
  check("anon cannot call mark_order_paid", !!(await anon.rpc("mark_order_paid", { p_order_id: crypto.randomUUID(), p_event_id: "e", p_event_type: "t", p_amount_cents: 1, p_session_id: "" })).error);
  check("anon cannot call rate_limit_hit", !!(await anon.rpc("rate_limit_hit", { p_key: "k", p_limit: 1, p_window_seconds: 1 })).error);

  // A signed-in user who is not staff
  const email = `rls-${Date.now()}@test.dev`;
  const pw = `pw-${crypto.randomUUID()}`;
  const made = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true });
  const user = createClient(url, anonKey, { auth: { persistSession: false } });
  await user.auth.signInWithPassword({ email, password: pw });
  check("non-staff sees no orders", ((await user.from("orders").select("id")).data ?? []).length === 0);
  check("non-staff sees no customers", ((await user.from("customers").select("id")).data ?? []).length === 0);
  check("non-staff cannot self-promote", !!(await user.from("profiles").insert({ user_id: made.data.user!.id, role: "owner" })).error);
  const u2 = await user.from("menu_items").update({ sold_out: true }).eq("id", target.id).select();
  check("non-staff cannot edit the menu", !!u2.error || (u2.data?.length ?? 0) === 0);
  if (made.data.user) await admin.auth.admin.deleteUser(made.data.user.id);

  console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll RLS checks passed");
  process.exit(failed ? 1 : 0);
}
main();
