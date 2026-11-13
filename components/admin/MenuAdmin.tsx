"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveCategory, setPublished, toggleSoldOut } from "@/app/admin/(console)/actions";
import { formatCents } from "@/lib/money";
import { Switch } from "./Switch";
import { useSay } from "./useSay";

type Cat = { id: string; slug: string; name: string; sort: number; published: boolean };
type Item = { id: string; category_id: string; name: string; price_cents: number; price_is_placeholder: boolean; image_src: string | null; sold_out: boolean; published: boolean };

export function MenuAdmin({ categories, items }: { categories: Cat[]; items: Item[] }) {
  const [rows, setRows] = useState(items);
  const [cats, setCats] = useState(categories);
  const [, start] = useTransition();
  const { say, node } = useSay();
  const router = useRouter();

  return (
    <div className="px-5 py-6 md:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[32px]">Menu</h1>
        <div className="flex gap-2">
          <Link href="/admin/menu/addons" className="btn btn-line !min-h-11">Add-ons</Link>
          <Link href="/admin/menu/new" className="btn btn-fire !min-h-11">New item</Link>
        </div>
      </div>
      {cats.map((c) => (
        <section key={c.id} className="mb-8">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <input aria-label={`${c.name} name`} defaultValue={c.name} className="min-h-10 rounded-xl border border-line bg-white px-3 font-display text-xl"
              onBlur={(e) => { const name = e.target.value.trim(); if (name && name !== c.name) start(async () => { const r = await saveCategory({ ...c, name }); if (r.ok) { setCats((p) => p.map((x) => (x.id === c.id ? { ...x, name } : x))); say("Category renamed"); router.refresh(); } else say(r.error, true); }); }} />
            <label className="flex items-center gap-2 text-sm font-semibold text-muted">Shown on site
              <Switch label={`${c.name} published`} checked={c.published} onCheckedChange={(v) => start(async () => { const r = await saveCategory({ ...c, published: v }); if (r.ok) { setCats((p) => p.map((x) => (x.id === c.id ? { ...x, published: v } : x))); say(v ? "Category shown" : "Category hidden"); } else say(r.error, true); })} />
            </label>
          </div>
          <div className="overflow-hidden rounded-3xl bg-white">
            {rows.filter((i) => i.category_id === c.id).map((i) => (
              <div key={i.id} className={`flex flex-wrap items-center gap-3 border-b border-[#f5ede1] px-4 py-3 last:border-b-0 ${i.published ? "" : "opacity-60"}`}>
                {i.image_src ? <Image src={i.image_src} alt="" width={44} height={44} className="size-11 rounded-xl object-cover" /> : <span className="size-11 rounded-xl bg-sand" />}
                <Link href={`/admin/menu/${i.id}`} className="min-w-[160px] flex-1 font-semibold text-coal no-underline hover:underline">{i.name}</Link>
                <span className="w-24 text-sm text-muted">{i.price_is_placeholder ? <b className="text-paprika-deep">[PRICE]</b> : formatCents(i.price_cents)}</span>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted">Published
                  <Switch label={`${i.name} published`} checked={i.published} onCheckedChange={(v) => { setRows((p) => p.map((x) => (x.id === i.id ? { ...x, published: v } : x))); start(async () => { const r = await setPublished({ itemId: i.id, published: v }); if (!r.ok) { setRows((p) => p.map((x) => (x.id === i.id ? { ...x, published: !v } : x))); say(r.error, true); } else say(v ? "Published" : "Hidden from the site"); }); }} />
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted">Available
                  <Switch label={`${i.name} available`} checked={!i.sold_out} onCheckedChange={(v) => { setRows((p) => p.map((x) => (x.id === i.id ? { ...x, sold_out: !v } : x))); start(async () => { const r = await toggleSoldOut({ itemId: i.id, soldOut: !v }); say(r.ok ? (v ? "Back on the menu" : "Marked sold out") : r.error, !r.ok); }); }} />
                </label>
              </div>
            ))}
            {rows.every((i) => i.category_id !== c.id) ? <p className="px-4 py-6 text-sm text-faint">No items yet.</p> : null}
          </div>
        </section>
      ))}
      <NewCategory onDone={() => router.refresh()} say={say} nextSort={cats.length + 1} />
      {node}
    </div>
  );
}

function NewCategory({ onDone, say, nextSort }: { onDone: () => void; say: (m: string, bad?: boolean) => void; nextSort: number }) {
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); start(async () => { const r = await saveCategory({ slug, name, sort: nextSort, published: false }); if (r.ok) { setName(""); say("Category added (hidden until you publish it)"); onDone(); } else say(r.error, true); }); }}>
      <label className="field">New category<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Desserts" /></label>
      <button type="submit" className="btn btn-coal !min-h-[50px]" disabled={pending || name.trim().length < 2}>Add category</button>
    </form>
  );
}
