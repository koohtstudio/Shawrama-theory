"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { retryPayment } from "@/app/(public)/actions";
import { useLiveStore } from "@/components/live/LiveStore";
import type { OrderView } from "@/lib/orders/status";
import { formatCents } from "@/lib/money";
import { formatInstant } from "@/lib/time";

type Status = OrderView["status"];
const STEPS: { key: Exclude<Status, "pending_payment" | "cancelled">; label: string }[] = [
  { key: "new", label: "Order in" },
  { key: "preparing", label: "On the grill" },
  { key: "ready", label: "Ready for pickup" },
];
const rank: Record<Status, number> = { pending_payment: -1, cancelled: -1, new: 0, preparing: 1, ready: 2, picked_up: 3 };

export function OrderTracker({ order, signedToken, cancelledPayment }: { order: OrderView; signedToken: string; cancelledPayment: boolean }) {
  const [status, setStatus] = useState<Status>(order.status);
  const [live, setLive] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const { settings } = useLiveStore();

  useEffect(() => {
    let stop = false;
    let teardown: (() => void) | undefined;
    (async () => {
      const { getBrowserClient } = await import("@/lib/supabase/browser");
      if (stop) return;
      const sb = getBrowserClient();
      // The topic is the secret order token, so only this link's holder hears this order.
      const ch = sb
        .channel(`order:${order.publicToken}`)
        .on("broadcast", { event: "status" }, (m) => {
          const s = (m.payload as { status?: Status }).status;
          if (s) setStatus(s);
        })
        .subscribe((st) => setLive(st === "SUBSCRIBED"));
      teardown = () => void sb.removeChannel(ch);
    })();
    // Fallback: if the socket is blocked, poll quietly.
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`/api/order-status/${signedToken}`, { cache: "no-store" });
        if (r.ok) setStatus(((await r.json()) as { status: Status }).status);
      } catch { /* offline: try again next tick */ }
    }, 15_000);
    return () => { stop = true; clearInterval(poll); teardown?.(); };
  }, [order.publicToken, signedToken]);

  const done = status === "picked_up";
  const headline =
    status === "pending_payment" ? "Almost done, payment needed"
    : status === "cancelled" ? "This order was cancelled"
    : status === "ready" ? `Ready for pickup, ${order.firstName}!`
    : status === "picked_up" ? "Enjoy! Thanks for coming in."
    : status === "preparing" ? "It's on the grill."
    : `Order in, ${order.firstName}.`;

  return (
    <section className="py-12 md:py-[72px]">
      <div className="wrap max-w-[760px]">
        <p className="eyebrow">Order #{order.orderNo}</p>
        <h1 className="h2" aria-live="polite">{headline}</h1>
        <p className="mt-4 text-lg text-muted">
          Pickup {order.asap && status === "new" ? `in about ${settings.prep_minutes} minutes` : formatInstant(new Date(order.pickupAt))} · 510 Bayfield St
        </p>

        {status === "pending_payment" ? (
          <div className="mt-8 rounded-[28px] bg-white p-7">
            <p className="mb-4">{cancelledPayment ? "Payment wasn't completed." : "We haven't received payment yet."} Your order goes to the kitchen the moment it is paid.</p>
            <button type="button" className="btn btn-fire" disabled={pending} onClick={() => start(async () => {
              const r = await retryPayment(signedToken);
              if ("redirectUrl" in r) window.location.assign(r.redirectUrl); else setErr(r.error);
            })}>{pending ? "One moment…" : `Pay ${formatCents(order.totalCents)}`}</button>
            {err ? <p role="alert" className="mt-3 text-sm font-semibold text-sumac">{err}</p> : null}
          </div>
        ) : status !== "cancelled" ? (
          <ol className="mt-10 grid grid-cols-3 gap-3" aria-label="Order progress">
            {STEPS.map((s) => {
              const reached = rank[status] >= rank[s.key];
              const current = rank[status] === rank[s.key] && !done;
              return (
                <li key={s.key} aria-current={current ? "step" : undefined} className={`rounded-[22px] p-4 transition duration-500 md:p-6 ${reached ? "bg-coal text-cream" : "bg-sand text-faint"} ${current && s.key === "ready" ? "ring-4 ring-ember" : ""}`}>
                  <span className={`mb-3 flex size-9 items-center justify-center rounded-full text-sm font-bold ${reached ? "bg-paprika text-white" : "bg-white/60"} ${current ? "dot-live" : ""}`}>{reached ? "✓" : ""}</span>
                  <b className="font-display text-base font-normal md:text-xl">{s.label}</b>
                </li>
              );
            })}
          </ol>
        ) : null}

        <div className="mt-10 rounded-[28px] bg-white p-7">
          <h2 className="mb-3 font-display text-2xl">Your order</h2>
          <ul className="flex flex-col gap-2">
            {order.items.map((i, n) => (
              <li key={n}><b>{i.qty} × {i.name}</b>{i.mods.length ? <span className="block text-sm text-muted">{i.mods.join(", ")}</span> : null}</li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-bold"><span>Total, tax included</span><span>{formatCents(order.totalCents)}</span></p>
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm text-faint">
          <span aria-hidden className={`size-2 rounded-full ${live ? "dot-live bg-go" : "bg-faint"}`} />
          {live ? "Live: this page updates by itself." : "Connecting… this page also refreshes every few seconds."}
        </p>
        <Link href="/menu" className="btn btn-line mt-6">Back to the menu</Link>
      </div>
    </section>
  );
}
