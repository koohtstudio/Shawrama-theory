import type { PaymentProvider } from "./types";

/** Mock mode: send the customer to a fake payment sheet. It settles through the same code path as Stripe. */
export const mockPayments: PaymentProvider = {
  async createCheckout({ signedToken }) {
    return { redirectUrl: `/pay/mock/${signedToken}` };
  },
};
