"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useLiveStore } from "@/components/live/LiveStore";
import { Photo } from "@/components/ui/Photo";
import type { MenuItem } from "@/lib/data/catalog";
import { formatCents } from "@/lib/money";

const ItemDialog = dynamic(() => import("./ItemDialog").then((m) => m.ItemDialog), { ssr: false });

export function priceLabel(item: Pick<MenuItem, "price_cents" | "price_is_placeholder">) {
  return item.price_is_placeholder ? "[PRICE]" : formatCents(item.price_cents);
}

export function MenuCard({ item, index = 0, priority = false }: { item: MenuItem; index?: number; priority?: boolean }) {
  const { itemState, beefToday, settings } = useLiveStore();
  const { add, flash } = useCart();
  const [dialog, setDialog] = useState(false);

  const state = itemState[item.id];
  if (state && !state.published) return null;
  const soldOut = state?.sold_out ?? item.sold_out;
  const beefBlocked = item.beef_only && beefToday === false;
  const paused = settings.ordering_paused;
  const unavailable = soldOut || beefBlocked;
  const label = soldOut ? "Sold out" : beefBlocked ? "Fri and Sun" : paused ? "Paused" : item.groups.length ? "Customize" : "+ Add";

  function onAdd() {
    if (item.groups.length) return setDialog(true);
    add({ itemId: item.id, name: item.name, image: item.image_src, unitCents: item.price_cents, placeholderPrice: item.price_is_placeholder, modifierIds: [], modifierNames: [] });
    flash(`${item.name} added`);
  }

  return (
    <article
      className={`lift-in group flex flex-col overflow-hidden rounded-[28px] bg-white transition duration-500 hover:-translate-y-2 hover:shadow-[0_34px_60px_-40px_rgba(23,18,15,0.7)] ${unavailable ? "opacity-70" : ""}`}
      style={{ animationDelay: `${Math.min(index, 8) * 0.06}s` }}
    >
      {item.image_src ? (
        <div className="relative h-[220px] overflow-hidden bg-sand md:h-[250px]">
          <Photo src={item.image_src} alt={item.image_alt} sizes="(min-width: 1024px) 400px, (min-width: 640px) 45vw, 92vw" priority={priority} quality={70} className={`transition-transform duration-[1200ms] group-hover:scale-[1.08] ${unavailable ? "grayscale" : ""}`} />
          <div className="absolute left-3.5 top-3.5 flex gap-1.5">
            {item.tags.map((t) => (
              <span key={t} className="rounded-full bg-white/90 px-2.5 py-[5px] text-xs font-bold text-[#2a4a1e]">{t}</span>
            ))}
          </div>
          {unavailable ? (
            <span className="absolute inset-x-0 bottom-0 bg-coal/85 py-2 text-center text-sm font-bold uppercase tracking-[0.14em] text-cream">
              {soldOut ? "Sold out" : "Fridays and Sundays"}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="flex h-[220px] items-center justify-center bg-sand p-5 text-center font-accent text-[26px] italic text-faint md:h-[250px]">
          Photo of the {item.name.toLowerCase()} goes here
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 px-6 pb-6 pt-[22px]">
        <h3 className="font-display text-[26px] leading-[1.15]">{item.name}</h3>
        <p className="flex-1 text-[15px] leading-[1.55] text-muted">{item.description}</p>
        <div className="mt-2.5 flex items-center justify-between">
          <span className={item.price_is_placeholder ? "text-[15px] font-semibold text-faint" : "text-xl font-semibold"}>{priceLabel(item)}</span>
          <button
            type="button"
            disabled={unavailable || paused}
            onClick={onAdd}
            aria-label={`${label === "+ Add" ? "Add" : label} ${item.name}`}
            className="min-h-[46px] cursor-pointer rounded-full border-[1.5px] border-coal bg-transparent px-[18px] text-sm font-semibold text-coal transition hover:bg-coal hover:text-cream disabled:cursor-not-allowed disabled:border-line disabled:text-faint disabled:hover:bg-transparent disabled:hover:text-faint"
          >
            {label}
          </button>
        </div>
      </div>
      {dialog ? <ItemDialog item={item} open={dialog} onOpenChange={setDialog} /> : null}
    </article>
  );
}
