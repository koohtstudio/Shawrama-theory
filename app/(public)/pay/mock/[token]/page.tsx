import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { payMock } from "@/app/(public)/actions";
import { isLive } from "@/lib/env";
import { formatCents } from "@/lib/money";
import { getOrderByToken } from "@/lib/orders/status";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Demo payment", robots: { index: false, follow: false } };

/** Mock mode only. A stand-in for Stripe Checkout; no card is read or charged. */
export default async function MockPayPage({ params }: { params: Promise<{ token: string }> }) {
  if (isLive) notFound();
  const { token } = await params;
  const signed = decodeURIComponent(token);
  const order = await getOrderByToken(signed);
  if (!order) notFound();
  return (
    <section className="py-12 md:py-[72px]">
      <div className="wrap max-w-[520px]">
        <p className="eyebrow">Demo checkout</p>
        <h1 className="h2">Pay {formatCents(order.totalCents)}</h1>
        <p className="mb-8 mt-4 text-muted">Order #{order.orderNo}. This is a stand-in for the card page, so nothing is charged.</p>
        <form action={payMock.bind(null, signed)} className="flex flex-col gap-4 rounded-[28px] bg-white p-7">
          <label className="field">Card number<input readOnly value="4242 4242 4242 4242" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="field">Expiry<input readOnly value="12 / 34" /></label>
            <label className="field">CVC<input readOnly value="123" /></label>
          </div>
          <button type="submit" className="btn btn-fire">Pay {formatCents(order.totalCents)}</button>
        </form>
      </div>
    </section>
  );
}
