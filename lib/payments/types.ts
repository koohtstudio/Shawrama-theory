export type CheckoutRequest = {
  orderId: string;
  orderNo: number;
  totalCents: number;
  signedToken: string;
  customerEmail: string | null;
};
export type PaymentProvider = {
  createCheckout(req: CheckoutRequest): Promise<{ redirectUrl: string }>;
};
