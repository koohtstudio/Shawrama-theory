"use client";
import { Dialog } from "radix-ui";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useLiveStore } from "@/components/live/LiveStore";
import { Photo } from "@/components/ui/Photo";
import type { MenuItem } from "@/lib/data/catalog";
import { formatCents } from "@/lib/money";

export function ItemDialog({ item, open, onOpenChange }: { item: MenuItem; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { modSoldOut } = useLiveStore();
  const { add, flash } = useCart();
  const [picked, setPicked] = useState<Record<string, string[]>>(() => {
    // Required single-choice groups start empty so the customer makes the choice.
    return Object.fromEntries(item.groups.map((g) => [g.id, []]));
  });
  const [qty, setQty] = useState(1);

  const chosen = useMemo(() => item.groups.flatMap((g) => g.modifiers.filter((m) => picked[g.id]?.includes(m.id))), [item.groups, picked]);
  const unit = item.price_cents + chosen.reduce((n, m) => n + m.price_delta_cents, 0);
  const valid = item.groups.every((g) => (picked[g.id]?.length ?? 0) >= g.min_select && (picked[g.id]?.length ?? 0) <= g.max_select);

  function toggle(gid: string, mid: string, max: number) {
    setPicked((p) => {
      const cur = p[gid] ?? [];
      if (cur.includes(mid)) return { ...p, [gid]: cur.filter((x) => x !== mid) };
      if (max === 1) return { ...p, [gid]: [mid] };
      return cur.length >= max ? p : { ...p, [gid]: [...cur, mid] };
    });
  }

  function submit() {
    add(
      { itemId: item.id, name: item.name, image: item.image_src, unitCents: unit, placeholderPrice: item.price_is_placeholder, modifierIds: chosen.map((m) => m.id), modifierNames: chosen.map((m) => m.name) },
      qty,
    );
    flash(`${item.name} added`);
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay fixed inset-0 z-[55] bg-coal/50" />
        <Dialog.Content className="drawer-up fixed inset-x-0 bottom-0 z-[60] flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px] bg-cream shadow-2xl md:inset-auto md:left-1/2 md:top-1/2 md:w-[520px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[28px]" aria-describedby={undefined}>
          {item.image_src ? (
            <div className="relative h-[180px] flex-none bg-sand md:h-[220px]">
              <Photo src={item.image_src} alt={item.image_alt} sizes="520px" />
            </div>
          ) : null}
          <div className="flex-1 overflow-y-auto px-[26px] pb-4 pt-6">
            <Dialog.Title className="font-display text-[28px] leading-tight">{item.name}</Dialog.Title>
            <p className="mb-5 mt-1.5 text-[15px] text-muted">{item.description}</p>
            {item.groups.map((g) => (
              <fieldset key={g.id} className="mb-5 border-0 p-0">
                <legend className="mb-2 flex w-full items-baseline justify-between text-sm font-bold">
                  <span>{g.name}</span>
                  <span className="text-xs font-semibold text-faint">{g.min_select ? "Required" : `Up to ${g.max_select}`}</span>
                </legend>
                <div className="flex flex-col gap-2">
                  {g.modifiers.map((m) => {
                    const out = modSoldOut[m.id] ?? m.sold_out;
                    const on = picked[g.id]?.includes(m.id);
                    return (
                      <label key={m.id} className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] bg-white px-3.5 transition ${on ? "border-coal" : "border-line"} ${out ? "cursor-not-allowed opacity-50" : ""}`}>
                        <input
                          type={g.max_select === 1 ? "radio" : "checkbox"}
                          name={g.id}
                          checked={!!on}
                          disabled={out}
                          onChange={() => toggle(g.id, m.id, g.max_select)}
                          className="size-[18px] accent-[#c8361d]"
                        />
                        <span className="flex-1 font-medium">{m.name}{out ? " (sold out)" : ""}</span>
                        {m.price_delta_cents ? <span className="text-sm text-muted">+{formatCents(m.price_delta_cents)}</span> : null}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="flex items-center gap-3 border-t border-line px-[26px] py-4">
            <div className="flex items-center gap-1">
              <button type="button" aria-label="One less" onClick={() => setQty((q) => Math.max(1, q - 1))} className="size-11 cursor-pointer rounded-full border border-[#d7c5ae] bg-cream">−</button>
              <span className="min-w-6 text-center font-bold" aria-live="polite">{qty}</span>
              <button type="button" aria-label="One more" onClick={() => setQty((q) => Math.min(20, q + 1))} className="size-11 cursor-pointer rounded-full border border-[#d7c5ae] bg-cream">+</button>
            </div>
            <button type="button" className="btn btn-fire flex-1" disabled={!valid} onClick={submit}>
              Add · {item.price_is_placeholder ? "[PRICE]" : formatCents(unit * qty)}
            </button>
          </div>
          <Dialog.Close asChild>
            <button type="button" aria-label="Close" className="absolute right-3 top-3 flex size-11 cursor-pointer items-center justify-center rounded-full bg-cream/90 text-coal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
