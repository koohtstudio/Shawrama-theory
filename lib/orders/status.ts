import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyOrderToken } from "@/lib/tokens";

export type OrderView = {
  id: string;
  publicToken: string;
  orderNo: number;
  status: "pending_payment" | "new" | "preparing" | "ready" | "picked_up" | "cancelled";
  paid: boolean;
  pickupAt: string;
  asap: boolean;
  totalCents: number;
  firstName: string;
  items: { name: string; qty: number; mods: string[] }[];
};

/** Looks an order up by its signed link. Returns null for forged, malformed or unknown tokens. */
export async function getOrderByToken(signed: string): Promise<OrderView | null> {
  const publicToken = verifyOrderToken(signed);
  if (!publicToken) return null;
  const { data: o } = await createAdminClient()
    .from("orders")
    .select("id, public_token, order_no, status, payment_status, pickup_at, asap, total_cents, customers(name), order_items(name_snapshot, qty, order_item_modifiers(name_snapshot))")
    .eq("public_token", publicToken)
    .maybeSingle();
  if (!o) return null;
  return {
    id: o.id,
    publicToken: o.public_token,
    orderNo: o.order_no,
    status: o.status,
    paid: o.payment_status === "paid",
    pickupAt: o.pickup_at,
    asap: o.asap,
    totalCents: o.total_cents,
    firstName: o.customers?.name.trim().split(/\s+/)[0] ?? "there",
    items: o.order_items.map((i) => ({ name: i.name_snapshot, qty: i.qty, mods: i.order_item_modifiers.map((m) => m.name_snapshot) })),
  };
}
