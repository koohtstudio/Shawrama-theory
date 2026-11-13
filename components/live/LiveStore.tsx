"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ClosureRow, HoursRow, StoreSettings } from "@/lib/data/catalog";
import { openStatus, torontoParts, type OpenStatus } from "@/lib/time";

export type LiveInitial = {
  settings: StoreSettings;
  beefDays: number[];
  hours: HoursRow[];
  closures: ClosureRow[];
  items: { id: string; sold_out: boolean; published: boolean }[];
  modifiers: { id: string; sold_out: boolean }[];
};

type LiveValue = {
  settings: StoreSettings;
  beefDays: number[];
  hours: HoursRow[];
  closures: ClosureRow[];
  itemState: Record<string, { sold_out: boolean; published: boolean }>;
  modSoldOut: Record<string, boolean>;
  /** Wall-clock "now", null until mounted (keeps static HTML free of time-dependent text). */
  now: Date | null;
  connected: boolean;
  status: OpenStatus | null;
  beefToday: boolean | null;
  orderingOpen: boolean;
};

const Ctx = createContext<LiveValue | null>(null);

export function useLiveStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLiveStore outside LiveStoreProvider");
  return v;
}

const toItemState = (rows: LiveInitial["items"]) => Object.fromEntries(rows.map((r) => [r.id, { sold_out: r.sold_out, published: r.published }]));
const toModState = (rows: LiveInitial["modifiers"]) => Object.fromEntries(rows.map((r) => [r.id, r.sold_out]));

export function LiveStoreProvider({ initial, children }: { initial: LiveInitial; children: ReactNode }) {
  const [settings, setSettings] = useState(initial.settings);
  const [beefDays, setBeefDays] = useState(initial.beefDays);
  const [hours, setHours] = useState(initial.hours);
  const [closures, setClosures] = useState(initial.closures);
  const [itemState, setItemState] = useState(() => toItemState(initial.items));
  const [modSoldOut, setModSoldOut] = useState(() => toModState(initial.modifiers));
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let teardown: (() => void) | undefined;

    async function start() {
      // supabase-js is loaded after the page is idle so it never competes with first paint.
      const { getBrowserClient } = await import("@/lib/supabase/browser");
      if (cancelled) return;
      const sb = getBrowserClient();

      async function refetch() {
        const [s, b, h, c, i, m] = await Promise.all([
          sb.from("store_settings").select("*").single(),
          sb.from("beef_schedule").select("dow"),
          sb.from("hours").select("*").order("dow"),
          sb.from("closures").select("*").order("on_date"),
          sb.from("menu_items").select("id, sold_out, published"),
          sb.from("modifiers").select("id, sold_out"),
        ]);
        if (cancelled) return;
        if (s.data) setSettings(s.data);
        if (b.data) setBeefDays(b.data.map((x) => x.dow));
        if (h.data) setHours(h.data);
        if (c.data) setClosures(c.data);
        if (i.data) {
          const seen = toItemState(i.data);
          // Rows missing from the public view were unpublished since the page was built.
          setItemState((prev) => {
            const next = { ...seen };
            for (const id of Object.keys(prev)) if (!next[id]) next[id] = { sold_out: prev[id]!.sold_out, published: false };
            return next;
          });
        }
        if (m.data) setModSoldOut(toModState(m.data));
      }

      const channel = sb
        .channel("public-store")
        .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, (p) => {
          if (p.new && "prep_minutes" in p.new) setSettings(p.new as StoreSettings);
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "menu_items" }, (p) => {
          const r = p.new as { id: string; sold_out: boolean; published: boolean };
          setItemState((prev) => ({ ...prev, [r.id]: { sold_out: r.sold_out, published: r.published } }));
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "modifiers" }, (p) => {
          const r = p.new as { id: string; sold_out: boolean };
          setModSoldOut((prev) => ({ ...prev, [r.id]: r.sold_out }));
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "beef_schedule" }, () => void refetch())
        .on("postgres_changes", { event: "*", schema: "public", table: "hours" }, () => void refetch())
        .on("postgres_changes", { event: "*", schema: "public", table: "closures" }, () => void refetch())
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnected(true);
            void refetch(); // catches anything that changed since this page was built or while offline
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setConnected(false);
          }
        });
      teardown = () => void sb.removeChannel(channel);
    }

    // Start after the first interaction, or after a few quiet seconds, so the realtime client
    // never competes with first paint. The first SUBSCRIBED refetch brings everything up to date.
    let started = false;
    const go = () => {
      if (started) return;
      started = true;
      void start();
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    for (const e of events) window.addEventListener(e, go, { once: true, passive: true });
    const timer = window.setTimeout(go, 6000);
    return () => {
      cancelled = true;
      for (const e of events) window.removeEventListener(e, go);
      clearTimeout(timer);
      teardown?.();
    };
  }, []);

  const value = useMemo<LiveValue>(() => {
    const status = now ? openStatus(now, hours, closures) : null;
    const beefToday = now
      ? settings.beef_mode === "on" || (settings.beef_mode === "auto" && beefDays.includes(torontoParts(now).dow))
      : null;
    return {
      settings, beefDays, hours, closures, itemState, modSoldOut, now, connected, status, beefToday,
      orderingOpen: !settings.ordering_paused,
    };
  }, [settings, beefDays, hours, closures, itemState, modSoldOut, now, connected]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
