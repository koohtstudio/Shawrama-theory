import "server-only";
import Stripe from "stripe";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import type { PaymentProvider } from "./types";

let client: Stripe | undefined;
export const getStripe = () => (client ??= new Stripe(serverEnv().STRIPE_SECRET_KEY!));

export const stripePayments: PaymentProvider = {
  async createCheckout({ orderId, orderNo, totalCents, signedToken, customerEmail, attempt = "first" }) {
    const site = publicEnv.NEXT_PUBLIC_SITE_URL;
    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: orderId,
        customer_email: customerEmail ?? undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "cad",
              unit_amount: totalCents,
              product_data: { name: `Shawarma Theory pickup order #${orderNo} (tax included)` },
            },
          },
        ],
        payment_intent_data: { metadata: { order_id: orderId } },
        metadata: { order_id: orderId },
        success_url: `${site}/order/${signedToken}`,
        cancel_url: `${site}/order/${signedToken}?payment=cancelled`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      },
      { idempotencyKey: `checkout-${orderId}-${attempt}` },
    );
    if (!session.url) throw new Error("Stripe returned no checkout URL");
    return { redirectUrl: session.url };
  },
};
