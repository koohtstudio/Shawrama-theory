"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { moveOrder, setBeefMode, setPaused, setPrep, toggleSoldOut } from "@/app/admin/(console)/actions";
import { chime, unlockAudio } from "@/lib/admin/chime";
import { ORDER_SELECT, type BoardOrder } from "@/lib/admin/orders";
import type { StoreSettings } from "@/lib/data/catalog";
import { formatCents } from "@/lib/money";
import { formatInstant } from "@/lib/time";
import { getBrowserClient } from "@/lib/supabase/browser";
import { Switch } from "./Switch";

type Item = { id: string; name: string; image_src: string | null; sold_out: boolean };
type Col = { status: "new" | "preparing" | "ready" | "picked_up"; title: string; btn?: { label: string; to: "preparing" | "ready" | "picked_up"; cls: string } };
const COLS: Col[] = [
  { status: "new", title: "New", btn: { label: "Accept", to: "preparing", cls: "btn-fire" } },
  { status: "preparing", title: "On the grill", btn: { label: "Ready", to: "ready", cls: "btn-fire" } },
  { status: "ready", title: "Ready", btn: { label: "Picked up", to: "picked_up", cls: "btn-line" } },
  { status: "picked_up", title: "Picked up" },
];

export function Board({ initialOrders, initialSettings, initialItems }: { initialOrders: BoardOrder[]; initialSettings: StoreSettings; initialItems: Item[] }) {
  const [orders, setOrders] = useState(() => new Map(initialOrders.map((o) => [o.id, o])));
  const [settings, setSettings] = useState(initialSettings);
  const [items, setItems] = useState(initialItems);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [sound, setSound] = useState(false);
  const [toast, setToast] = useState("");
  const [live, setLive] = useState(false);
  const [, start] = useTransition();
  const soundRef = useRef(false);
  soundRef.current = sound;

  const say = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  }, []);

  const upsert = useCallback((o: BoardOrder) => {
    setOrders((prev) => {
      const next = new Map(prev);
      if (o.status === "pending_payment" || o.status === "cancelled") next.delete(o.id);
      else next.set(o.id, o);
      return next;
    });
  }, []);

  // Realtime: staff's own session, so RLS applies. New paid orders arrive here the moment they are paid.
  useEffect(() => {
    const sb = getBrowserClient();
    const known = new Set(initialOrders.map((o) => o.id));
    let cancelled = false;
    let channel: ReturnType<typeof sb.channel> | undefined;
    const load = async (id: string) => {
      const { data } = await sb.from("orders").select(ORDER_SELECT).eq("id", id).single();
      if (!data) return;
      const o = data as unknown as BoardOrder;
      const isNew = o.status === "new" && !known.has(o.id);
      known.add(o.id);
      upsert(o);
      if (isNew) {
        setFresh((f) => new Set(f).add(o.id));
        if (soundRef.current) chime();
        say(`New order #${o.order_no}`);
      }
    };
    (async () => {
      // Realtime must carry the staff member's JWT, or RLS (correctly) hides every order from it.
      const { data } = await sb.auth.getSession();
      if (data.session) await sb.realtime.setAuth(data.session.access_token);
      if (cancelled) return;
      channel = sb
        .channel("admin-board")
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (p) => {
          const row = (p.new && "id" in p.new ? p.new : p.old) as { id?: string } | undefined;
          if (row?.id) void load(row.id);
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "store_settings" }, (p) => setSettings(p.new as StoreSettings))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "menu_items" }, (p) => {
          const r = p.new as Item;
          setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, sold_out: r.sold_out } : i)));
        })
        .subscribe((st) => setLive(st === "SUBSCRIBED"));
    })();
    // Keep the socket's token fresh when the session refreshes.
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (session) void sb.realtime.setAuth(session.access_token);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      if (channel) void sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byStatus = useMemo(() => {
    const m: Record<string, BoardOrder[]> = { new: [], preparing: [], ready: [], picked_up: [] };
    for (const o of orders.values()) m[o.status]?.push(o);
    for (const k of Object.keys(m)) m[k]!.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    m.picked_up!.reverse();
    return m;
  }, [orders]);

  const newCount = byStatus.new!.length;
  useEffect(() => {
    document.title = `${newCount ? `(${newCount}) ` : ""}Orders | Admin`;
    (navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> }).setAppBadge?.(newCount).catch(() => undefined);
  }, [newCount]);

  const paid = [...orders.values()].filter((o) => o.payment_status === "paid" && o.status !== "cancelled");
  const sales = paid.reduce((n, o) => n + o.total_cents, 0);

  function move(o: BoardOrder, to: "preparing" | "ready" | "picked_up") {
    const prev = o.status;
    upsert({ ...o, status: to }); // optimistic; the realtime event confirms it
    setFresh((f) => { const n = new Set(f); n.delete(o.id); return n; });
    start(async () => {
      const r = await moveOrder({ orderId: o.id, status: to });
      if (!r.ok) { upsert({ ...o, status: prev }); say(r.error); }
      else say(to === "ready" ? `Texted ${o.customers?.name.split(" ")[0] ?? "customer"}: order is ready` : `#${o.order_no} moved`);
    });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 md:px-7">
        <div>
          <h1 className="font-display text-[28px]">Today&apos;s orders</h1>
          <small className="flex items-center gap-2 text-faint"><span aria-hidden className={`size-2 rounded-full ${live ? "dot-live bg-go" : "bg-faint"}`} />{live ? "Live" : "Connecting…"}</small>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-line !min-h-11" onClick={() => { const st = unlockAudio(); setSound(st === "running"); if (st === "running") chime(); }} aria-pressed={sound}>
            {sound ? "Sound on" : "Turn on sound"}
          </button>
          <span className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-line bg-white pl-4 pr-1.5 font-semibold">
            Prep time
            <span className="inline-flex items-center gap-1">
              <button type="button" aria-label="Less prep time" disabled={settings.prep_minutes <= 5} className="size-8 cursor-pointer rounded-full border border-line bg-cream disabled:opacity-40" onClick={() => { const m = settings.prep_minutes - 5; setSettings({ ...settings, prep_minutes: m }); start(async () => { const r = await setPrep({ minutes: m }); if (!r.ok) say(r.error); }); }}>−</button>
              <b className="min-w-[54px] text-center">{settings.prep_minutes} min</b>
              <button type="button" aria-label="More prep time" disabled={settings.prep_minutes >= 120} className="size-8 cursor-pointer rounded-full border border-line bg-cream disabled:opacity-40" onClick={() => { const m = settings.prep_minutes + 5; setSettings({ ...settings, prep_minutes: m }); start(async () => { const r = await setPrep({ minutes: m }); if (!r.ok) say(r.error); }); }}>+</button>
            </span>
          </span>
          <span className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-line bg-white pl-4 pr-1.5 font-semibold">
            {settings.ordering_paused ? "Online orders paused" : "Taking online orders"}
            <Switch label="Online ordering" checked={!settings.ordering_paused} onCheckedChange={(on) => { setSettings({ ...settings, ordering_paused: !on }); start(async () => { const r = await setPaused({ paused: !on }); say(r.ok ? (on ? "Online ordering back on" : "Online ordering paused") : r.error); }); }} />
          </span>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 p-5 md:flex-row md:px-7">
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          {settings.ordering_paused ? <p className="rounded-2xl bg-sumac px-4 py-3 font-semibold text-cream">Online ordering is paused. The website shows your pause message until you switch it back on.</p> : null}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Orders today" value={String(paid.length)} />
            <Kpi label="Sales today" value={formatCents(sales)} />
            <Kpi label="In the kitchen" value={String(byStatus.preparing!.length)} />
            <Kpi label="Sold out" value={String(items.filter((i) => i.sold_out).length)} />
          </div>
          <div className="grid flex-1 gap-3.5 md:grid-cols-4">
            {COLS.map((c) => (
              <section key={c.status} aria-label={c.title} className="flex flex-col gap-2.5 rounded-[22px] bg-sand p-3.5">
                <div className="flex items-center justify-between px-1.5 pb-1.5">
                  <b className="font-display text-xl font-normal">{c.title}</b>
                  <span className="inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-coal px-2 text-xs font-bold text-cream">{byStatus[c.status]!.length}</span>
                </div>
                {byStatus[c.status]!.length === 0 ? <p className="py-8 text-center text-[13px] text-faint">Nothing here right now.</p> : null}
                {byStatus[c.status]!.map((o) => (
                  <article key={o.id} className={`flex flex-col gap-2 rounded-2xl bg-white p-3.5 ${fresh.has(o.id) ? "flash-new" : ""}`}>
                    <div className="flex items-baseline justify-between gap-2.5">
                      <b className="font-display text-lg font-normal">#{o.order_no} · {o.customers?.name ?? "Guest"}</b>
                      <small className="text-faint">{o.payment_status === "paid" ? "Paid" : "Unpaid"}</small>
                    </div>
                    <ul className="leading-[1.55] text-[#4a3b31]">
                      {o.order_items.map((i, n) => (
                        <li key={n}>{i.qty} × {i.name_snapshot}{i.order_item_modifiers.length ? <span className="block text-sm text-muted">+ {i.order_item_modifiers.map((m) => m.name_snapshot).join(", ")}</span> : null}</li>
                      ))}
                    </ul>
                    {o.notes ? <p className="rounded-[10px] bg-[#fff4e6] px-2.5 py-1.5 text-[13px] font-semibold text-[#7a3e0e]">{o.notes}</p> : null}
                    <div className="flex items-center justify-between gap-2">
                      <small className="text-faint">Pickup {o.asap && c.status === "new" ? "ASAP · " : ""}{formatInstant(new Date(o.pickup_at))} · {formatCents(o.total_cents)}{o.customers ? ` · ${o.customers.phone}` : ""}</small>
                    </div>
                    {c.btn ? (
                      <button type="button" onClick={() => move(o, c.btn!.to)} className={`btn ${c.btn.cls} ${c.status === "preparing" ? "!min-h-[56px] text-base" : "!min-h-[44px]"}`}>
                        {c.btn.label}{c.status === "preparing" ? " · notify customer" : ""}
                      </button>
                    ) : null}
                  </article>
                ))}
              </section>
            ))}
          </div>
        </div>

        <aside className="flex w-full flex-none flex-col overflow-hidden rounded-3xl bg-white md:w-[340px]">
          <div className="border-b border-[#efe4d4] px-5 py-[18px]">
            <b className="block font-display text-[22px] font-normal">Menu right now</b>
            <small className="text-faint">Flip a switch and the website updates instantly.</small>
          </div>
          <div className="border-b border-[#f5ede1] bg-[#fff4e6] px-5 py-3">
            <b className="block font-semibold">Beef and lamb on the spit</b>
            <div role="radiogroup" aria-label="Beef and lamb" className="mt-2 flex gap-1.5">
              {(["auto", "on", "off"] as const).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={settings.beef_mode === m} onClick={() => { setSettings({ ...settings, beef_mode: m }); start(async () => { const r = await setBeefMode({ mode: m }); say(r.ok ? `Beef and lamb: ${m === "auto" ? "follows the schedule" : m}` : r.error); }); }}
                  className={`min-h-10 flex-1 cursor-pointer rounded-full border-[1.5px] text-sm font-semibold ${settings.beef_mode === m ? "border-coal bg-coal text-cream" : "border-line bg-white"}`}>
                  {m === "auto" ? "Schedule" : m === "on" ? "On" : "Off"}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[60vh] flex-1 overflow-y-auto">
            {items.map((i) => (
              <div key={i.id} className={`flex items-center gap-3 border-b border-[#f5ede1] px-5 py-3 ${i.sold_out ? "opacity-60" : ""}`}>
                <div className="min-w-0 flex-1"><b className="block font-semibold">{i.name}</b><small className={i.sold_out ? "font-bold text-paprika-deep" : "text-faint"}>{i.sold_out ? "Sold out on the website" : "Available"}</small></div>
                <Switch label={`${i.name} available`} checked={!i.sold_out} onCheckedChange={(on) => { setItems((p) => p.map((x) => (x.id === i.id ? { ...x, sold_out: !on } : x))); start(async () => { const r = await toggleSoldOut({ itemId: i.id, soldOut: !on }); say(r.ok ? `${i.name} ${on ? "back on the menu" : "marked sold out"}` : r.error); }); }} />
              </div>
            ))}
          </div>
        </aside>
      </div>
      <div role="status" className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-coal px-5 py-3 font-semibold text-cream transition-all duration-500 ${toast ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>{toast || " "}</div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-white px-[18px] py-3.5">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">{label}</span>
      <b className="mt-1 block font-display text-[28px] font-normal">{value}</b>
    </div>
  );
}
