import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTracker } from "@/components/public/OrderTracker";
import { getOrderByToken } from "@/lib/orders/status";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ payment?: string }> }) {
  const { token } = await params;
  const order = await getOrderByToken(decodeURIComponent(token));
  if (!order) notFound();
  const sp = await searchParams;
  return <OrderTracker order={order} signedToken={decodeURIComponent(token)} cancelledPayment={sp.payment === "cancelled"} />;
}
