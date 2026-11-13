"use client";
import { useEffect, useState } from "react";
import { HOUSE_SAUCES } from "@/lib/content";
import type { Category, MenuItem } from "@/lib/data/catalog";
import { BeefBanner } from "./BeefBanner";
import { MenuCard } from "./MenuCard";

export function MenuBrowser({ categories, items }: { categories: Category[]; items: MenuItem[] }) {
  const cats = categories.filter((c) => items.some((i) => i.category_id === c.id));
  const [tab, setTab] = useState(cats[0]?.slug ?? "");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && cats.some((c) => c.slug === hash)) setTab(hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(slug: string) {
    setTab(slug);
    history.replaceState(null, "", `#${slug}`);
  }

  return (
    <div>
      <div className="mb-[34px] flex flex-wrap items-end justify-between gap-[30px]">
        <div>
          <p className="eyebrow">The menu</p>
          <h1 className="h2">Pick it, <span className="accent">we&apos;ll load it.</span></h1>
        </div>
        <div role="group" aria-label="Menu sections" className="flex flex-wrap gap-1.5 rounded-[22px] bg-sand p-1.5 md:rounded-full">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={tab === c.slug}
              onClick={() => pick(c.slug)}
              className={`min-h-11 cursor-pointer rounded-full border-0 px-3.5 text-sm font-semibold transition md:px-5 md:text-[15px] ${tab === c.slug ? "bg-coal text-cream" : "bg-transparent text-muted hover:bg-white/50"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <BeefBanner className="mb-7" />
      {cats.map((c) => (
        <div key={c.id} hidden={tab !== c.slug} id={c.slug} className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {items.filter((i) => i.category_id === c.id).map((i, n) => (
            <MenuCard key={i.id} item={i} index={n} />
          ))}
        </div>
      ))}
      <div className="mt-[34px] flex flex-wrap items-center gap-3">
        <span className="eyebrow !mb-0 mr-2.5">House sauces</span>
        {HOUSE_SAUCES.map((s) => (
          <span key={s} className="rounded-full border-[1.5px] border-dashed border-[#c9b49b] px-[22px] py-2.5 font-accent text-2xl italic transition duration-500 hover:-rotate-2 hover:scale-105 hover:border-ember hover:bg-ember hover:text-coal">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
