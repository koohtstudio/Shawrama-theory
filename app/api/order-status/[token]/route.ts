import { NextResponse } from "next/server";
import { getOrderByToken } from "@/lib/orders/status";

export const dynamic = "force-dynamic";

/** Polling fallback for the status page. Returns the status only, never personal data. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ status: order.status, paid: order.paid }, { headers: { "Cache-Control": "no-store" } });
}
