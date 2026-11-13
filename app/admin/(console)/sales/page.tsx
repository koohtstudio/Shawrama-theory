import type { Metadata } from "next";
import { formatCents } from "@/lib/money";
import { requireStaff } from "@/lib/security/admin-action";
import { torontoParts, torontoToUtc } from "@/lib/time";

export const metadata: Metadata = { title: "Sales today" };

export default async function SalesPage() {
  const { supabase } = (await requireStaff())!;
  const start = torontoToUtc(torontoParts().date, 0).toISOString();
  const { data } = await supabase
    .from("orders")
    .select("id, total_cents, tax_cents, status, order_items(name_snapshot, qty)")
    .eq("payment_status", "paid")
    .gte("paid_at", start);
  const orders = (data ?? []).filter((o) => o.status !== "cancelled");
  const total = orders.reduce((n, o) => n + o.total_cents, 0);
  const tax = orders.reduce((n, o) => n + o.tax_cents, 0);
  const counts = new Map<string, number>();
  for (const o of orders) for (const i of o.order_items) counts.set(i.name_snapshot, (counts.get(i.name_snapshot) ?? 0) + i.qty);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  return (
    <div className="flex max-w-[760px] flex-col gap-5 px-5 py-6 md:px-8">
      <h1 className="font-display text-[32px]">Sales today</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        {[["Paid orders", String(orders.length)], ["Total, tax included", formatCents(total)], ["Tax collected", formatCents(tax)]].map(([l, v]) => (
          <div key={l} className="rounded-[18px] bg-white px-[18px] py-4"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">{l}</span><b className="mt-1 block font-display text-3xl font-normal">{v}</b></div>
        ))}
      </div>
      <section className="rounded-3xl bg-white p-5">
        <h2 className="mb-3 font-display text-2xl">What sold</h2>
        {top.length === 0 ? <p className="text-faint">No paid online orders yet today.</p> : top.map(([n, q]) => <p key={n} className="flex justify-between border-b border-dashed border-line py-2 last:border-b-0"><span>{n}</span><b>{q}</b></p>)}
        <p className="mt-4 text-xs text-faint">Online pickup orders only. Delivery apps and counter sales aren&apos;t included.</p>
      </section>
    </div>
  );
}
