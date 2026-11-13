import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { isMock } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import { settlePayment } from "@/lib/payments";
import { getStripe } from "@/lib/payments/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The only way an order becomes paid in live mode. The signature is verified against the raw body,
 * the amount must equal the order total, and replays are ignored by the database.
 */
export async function POST(req: Request) {
  if (isMock) return new NextResponse("Not found", { status: 404 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, serverEnv().STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new NextResponse("Bad signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.client_reference_id ?? session.metadata?.order_id;
    if (session.payment_status === "paid" && orderId && session.amount_total != null) {
      try {
        const result = await settlePayment({
          eventId: event.id,
          type: event.type,
          orderId,
          amountCents: session.amount_total,
          sessionId: session.id,
        });
        if (result === "amount_mismatch" || result === "not_found") console.error("stripe webhook rejected", { orderId, result });
      } catch (e) {
        console.error("stripe webhook failed", e);
        return new NextResponse("Retry", { status: 500 }); // Stripe will redeliver
      }
    }
  }
  return NextResponse.json({ received: true });
}
