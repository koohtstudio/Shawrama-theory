"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveModifierGroup, toggleModifierSoldOut } from "@/app/admin/(console)/actions";
import { Switch } from "./Switch";
import { useSay } from "./useSay";

type Mod = { id?: string; name: string; price: string; placeholder: boolean; sold_out?: boolean };
export type GroupValue = { id?: string; name: string; min_select: number; max_select: number; modifiers: Mod[] };

export function AddonsEditor({ groups }: { groups: GroupValue[] }) {
  const empty: GroupValue = { name: "", min_select: 0, max_select: 1, modifiers: [{ name: "", price: "0.00", placeholder: true }] };
  return (
    <div className="flex flex-col gap-5 px-5 py-6 md:px-8">
      <h1 className="font-display text-[32px]">Add-ons</h1>
      <p className="max-w-[60ch] text-muted">Groups of choices (sauces, toppings) that you attach to items from each item&apos;s edit page.</p>
      {groups.map((g) => <Group key={g.id} initial={g} />)}
      <Group initial={empty} isNew />
    </div>
  );
}

function Group({ initial, isNew }: { initial: GroupValue; isNew?: boolean }) {
  const [g, setG] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const { say, node } = useSay();
  const setMod = (i: number, patch: Partial<Mod>) => setG((p) => ({ ...p, modifiers: p.modifiers.map((m, n) => (n === i ? { ...m, ...patch } : m)) }));
  return (
    <form className="flex flex-col gap-3 rounded-3xl bg-white p-5" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await saveModifierGroup({ id: g.id, name: g.name, min_select: g.min_select, max_select: g.max_select, modifiers: g.modifiers.filter((m) => m.name.trim()).map((m) => ({ id: m.id, name: m.name, price_delta_cents: Math.round(Number(m.price) * 100) || 0, price_is_placeholder: m.placeholder })) });
        if (r.ok) { say("Saved"); router.refresh(); if (isNew) setG({ name: "", min_select: 0, max_select: 1, modifiers: [{ name: "", price: "0.00", placeholder: true }] }); } else say(r.error, true);
      });
    }}>
      <div className="grid gap-3 md:grid-cols-[1fr_110px_110px]">
        <label className="field">{isNew ? "New group name" : "Group name"}<input value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} placeholder="Add-ons" /></label>
        <label className="field">Min<input type="number" min={0} value={g.min_select} onChange={(e) => setG({ ...g, min_select: Number(e.target.value) })} /></label>
        <label className="field">Max<input type="number" min={1} value={g.max_select} onChange={(e) => setG({ ...g, max_select: Number(e.target.value) })} /></label>
      </div>
      {g.modifiers.map((m, i) => (
        <div key={m.id ?? i} className="flex flex-wrap items-center gap-2">
          <input aria-label="Choice name" className="min-h-11 min-w-[160px] flex-1 rounded-xl border border-line px-3" value={m.name} onChange={(e) => setMod(i, { name: e.target.value })} placeholder="Extra garlic" />
          <input aria-label="Extra price in dollars" inputMode="decimal" className="min-h-11 w-24 rounded-xl border border-line px-3" value={m.price} onChange={(e) => setMod(i, { price: e.target.value })} />
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted"><input type="checkbox" className="size-4 accent-[#c8361d]" checked={m.placeholder} onChange={(e) => setMod(i, { placeholder: e.target.checked })} />placeholder</label>
          {m.id ? <Switch label={`${m.name} available`} checked={!m.sold_out} onCheckedChange={(on) => { setMod(i, { sold_out: !on }); start(async () => { const r = await toggleModifierSoldOut({ modifierId: m.id!, soldOut: !on }); say(r.ok ? (on ? "Available again" : "Marked sold out") : r.error, !r.ok); }); }} /> : null}
          <button type="button" aria-label="Remove choice" className="size-10 cursor-pointer rounded-full border border-line" onClick={() => setG({ ...g, modifiers: g.modifiers.filter((_, n) => n !== i) })}>×</button>
        </div>
      ))}
      <div className="flex gap-2">
        <button type="button" className="btn btn-line !min-h-11" onClick={() => setG({ ...g, modifiers: [...g.modifiers, { name: "", price: "0.00", placeholder: true }] })}>Add a choice</button>
        <button type="submit" className="btn btn-coal !min-h-11" disabled={pending || g.name.trim().length < 2}>{pending ? "Saving…" : "Save group"}</button>
      </div>
      {node}
    </form>
  );
}
