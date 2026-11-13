import "server-only";
import { isMock } from "@/lib/env";
import { mockPayments } from "./mock";
import { stripePayments } from "./stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderMessage } from "@/lib/notify";

export const payments = isMock ? mockPayments : stripePayments;

export type PaymentEvent = {
  eventId: string;
  type: string;
  orderId: string;
  amountCents: number;
  sessionId: string | null;
};

/**
 * The only place an order becomes "paid". Called by the Stripe webhook (after signature
 * verification) and by the mock pay page. Idempotent: replays are ignored by the database.
 */
export async function settlePayment(e: PaymentEvent): Promise<string> {
  const db = createAdminClient();
  const { data, error } = await db.rpc("mark_order_paid", {
    p_order_id: e.orderId,
    p_event_id: e.eventId,
    p_event_type: e.type,
    p_amount_cents: e.amountCents,
    p_session_id: e.sessionId ?? "",
  });
  if (error) throw new Error(`mark_order_paid failed: ${error.message}`);
  if (data === "paid") await sendOrderMessage(e.orderId, "order_confirmation");
  return data as string;
}
