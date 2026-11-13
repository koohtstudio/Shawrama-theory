"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyCaptcha as captchaGuard } from "@/lib/captcha";
import { isLive } from "@/lib/env";
import { asapPickup, isPickupAllowed } from "@/lib/time";
import { orderInputSchema, type PlaceOrderResult } from "@/lib/orders/schema";
import { payments, settlePayment } from "@/lib/payments";
import { allow, hashKey } from "@/lib/ratelimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { signOrderToken, verifyOrderToken } from "@/lib/tokens";

const GENERIC = "Something went wrong. Please try again.";

function friendly(message: string): PlaceOrderResult {
  const [code, arg] = message.split(":");
  switch (code) {
    case "ordering_paused":
      return { ok: false, code: "paused", error: "Online ordering is paused right now. Please check back in a few minutes." };
    case "sold_out":
      return { ok: false, code: "unavailable", error: `${arg ?? "An item"} just sold out. Remove it and try again.` };
    case "beef_unavailable":
      return { ok: false, code: "unavailable", error: `${arg ?? "Beef and lamb"} is only on Fridays and Sundays.` };
    case "modifier_selection":
      return { ok: false, code: "unavailable", error: `Check your choices for ${arg ?? "an item"}.` };
    case "item_unavailable":
    case "modifier_invalid":
      return { ok: false, code: "unavailable", error: "An item in your order is no longer available. Please review your order." };
    default:
      return { ok: false, error: GENERIC };
  }
}

export async function placeOrder(raw: unknown): Promise<PlaceOrderResult> {
  const parsed = orderInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please check your details.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const input = parsed.data;
  if (input.website) return { ok: false, error: GENERIC }; // honeypot tripped: look like any other failure

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  const phoneDigits = input.phone.replace(/\D/g, "");
  const okIp = await allow(`order:ip:${hashKey(ip)}`, 8, 600);
  const okPhone = await allow(`order:phone:${hashKey(phoneDigits)}`, 5, 3600);
  if (!okIp || !okPhone) return { ok: false, error: "Too many orders from this device. Please wait a few minutes." };
  if (!(await captchaGuard(input.captchaToken, ip))) return { ok: false, error: "Could not verify you are human. Refresh and try again." };

  const db = createAdminClient();
  const [settings, hours, closures] = await Promise.all([
    db.from("store_settings").select("*").single(),
    db.from("hours").select("*"),
    db.from("closures").select("*"),
  ]);
  if (!settings.data || !hours.data || !closures.data) return { ok: false, error: GENERIC };
  if (settings.data.ordering_paused) return friendly("ordering_paused");

  const now = new Date();
  let pickupAt: Date | null;
  if (input.pickup.kind === "asap") {
    pickupAt = asapPickup(now, settings.data.prep_minutes, hours.data, closures.data);
  } else {
    pickupAt = new Date(input.pickup.at);
    if (!isPickupAllowed({ pickupAt, now, hours: hours.data, closures: closures.data, prepMinutes: settings.data.prep_minutes })) pickupAt = null;
  }
  if (!pickupAt) return { ok: false, code: "closed", error: "That pickup time isn't available. Please pick another." };

  // Only ids and quantities cross the wire. The database prices everything.
  const { data, error } = await db.rpc("create_order", {
    p_idempotency_key: input.idempotencyKey,
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email,
    p_pickup_at: pickupAt.toISOString(),
    p_asap: input.pickup.kind === "asap",
    p_notes: input.notes,
    p_lines: input.lines.map((l) => ({ item_id: l.itemId, qty: l.qty, modifier_ids: l.modifierIds })),
  });
  if (error) return friendly(error.message);

  const order = data as { order_id: string; order_no: number; public_token: string; total_cents: number };
  try {
    const { redirectUrl } = await payments.createCheckout({
      orderId: order.order_id,
      orderNo: order.order_no,
      totalCents: order.total_cents,
      signedToken: signOrderToken(order.public_token),
      customerEmail: input.email,
    });
    return { ok: true, redirectUrl };
  } catch (e) {
    console.error("checkout failed", e);
    // The order exists but is unpaid; the status page lets them retry payment.
    return { ok: true, redirectUrl: `/order/${signOrderToken(order.public_token)}` };
  }
}

/** From the status page: start payment again for an order that was never paid. */
export async function retryPayment(signedToken: string): Promise<{ redirectUrl: string } | { error: string }> {
  const publicToken = verifyOrderToken(signedToken);
  if (!publicToken) return { error: "Invalid link" };
  const db = createAdminClient();
  const { data: o } = await db
    .from("orders")
    .select("id, order_no, total_cents, payment_status, status, customers(email)")
    .eq("public_token", publicToken)
    .single();
  if (!o || o.payment_status === "paid" || o.status === "cancelled") return { error: "This order can't be paid." };
  try {
    return await payments.createCheckout({
      orderId: o.id,
      orderNo: o.order_no,
      totalCents: o.total_cents,
      signedToken,
      customerEmail: o.customers?.email ?? null,
      attempt: crypto.randomUUID(),
    });
  } catch {
    return { error: "Payment is unavailable right now." };
  }
}

/** Mock mode only: the fake pay sheet settles through the same path as the Stripe webhook. */
export async function payMock(signedToken: string): Promise<void> {
  if (isLive) throw new Error("not available");
  const publicToken = verifyOrderToken(signedToken);
  if (!publicToken) redirect("/");
  const db = createAdminClient();
  const { data: o } = await db.from("orders").select("id, total_cents").eq("public_token", publicToken).single();
  if (!o) redirect("/");
  await settlePayment({
    eventId: `mock_${o.id}_${Date.now()}`,
    type: "mock.payment_succeeded",
    orderId: o.id,
    amountCents: o.total_cents,
    sessionId: null,
  });
  redirect(`/order/${signedToken}`);
}
