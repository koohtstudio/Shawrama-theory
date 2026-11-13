"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteItem, saveItem, uploadItemPhoto } from "@/app/admin/(console)/actions";
import { useSay } from "./useSay";

export type ItemFormValue = {
  id?: string; category_id: string; slug: string; name: string; description: string; price_cents: number; price_is_placeholder: boolean;
  image_src: string | null; image_alt: string; tags: string[]; beef_only: boolean; featured: boolean; published: boolean; sort: number; group_ids: string[];
};

export function ItemForm({ initial, categories, groups }: { initial: ItemFormValue; categories: { id: string; name: string }[]; groups: { id: string; name: string }[] }) {
  const [v, setV] = useState(initial);
  const [price, setPrice] = useState((initial.price_cents / 100).toFixed(2));
  const [errs, setErrs] = useState<Record<string, string[] | undefined>>({});
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { say, node } = useSay();
  const set = <K extends keyof ItemFormValue>(k: K, val: ItemFormValue[K]) => setV((p) => ({ ...p, [k]: val }));

  async function upload(f: File) {
    setUploading(true);
    const fd = new FormData();
    fd.set("file", f);
    const r = await uploadItemPhoto(fd);
    setUploading(false);
    if (r.ok) { set("image_src", r.data.url); say("Photo uploaded. Save to publish it."); } else say(r.error, true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await saveItem({ ...v, price_cents: Math.round(Number(price) * 100) || 0, slug: v.slug || v.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") });
      if (r.ok) { say("Saved. The website updates in a moment."); setErrs({}); if (!v.id) router.replace(`/admin/menu/${r.data.id}`); else router.refresh(); }
      else { setErrs(r.fieldErrors ?? {}); say(r.error, true); }
    });
  }

  const Err = ({ k }: { k: string }) => (errs[k]?.length ? <small role="alert" className="font-medium text-sumac">{errs[k]![0]}</small> : null);
  return (
    <form onSubmit={save} className="grid gap-6 px-5 py-6 md:grid-cols-[1fr_320px] md:px-8">
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-[32px]">{v.id ? "Edit item" : "New item"}</h1>
        <label className="field">Name<input value={v.name} onChange={(e) => set("name", e.target.value)} required /><Err k="name" /></label>
        <label className="field">Description<textarea rows={3} value={v.description} onChange={(e) => set("description", e.target.value)} /><Err k="description" /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">Category<select value={v.category_id} onChange={(e) => set("category_id", e.target.value)}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="field">Price (CAD, before tax)<input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /><Err k="price_cents" /></label>
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[#c8361d]" checked={v.price_is_placeholder} onChange={(e) => set("price_is_placeholder", e.target.checked)} />Price is a placeholder (shows as [PRICE] and can&apos;t be published live)</label>
        <label className="field">Tags, comma separated<input value={v.tags.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5))} placeholder="Vegan, GF" /><Err k="tags" /></label>
        <label className="field">Sort order<input type="number" value={v.sort} onChange={(e) => set("sort", Number(e.target.value))} /></label>
        <fieldset className="flex flex-col gap-2 rounded-2xl bg-white p-4">
          <legend className="px-1 text-sm font-bold">Add-on groups</legend>
          {groups.length === 0 ? <p className="text-sm text-faint">No add-on groups yet. Create them under Menu → Add-ons.</p> : null}
          {groups.map((g) => (
            <label key={g.id} className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" className="size-5 accent-[#c8361d]" checked={v.group_ids.includes(g.id)} onChange={(e) => set("group_ids", e.target.checked ? [...v.group_ids, g.id] : v.group_ids.filter((x) => x !== g.id))} />{g.name}</label>
          ))}
        </fieldset>
      </div>
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl bg-white p-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand">
            {v.image_src ? <Image src={v.image_src} alt="" fill sizes="320px" className="object-cover" /> : <span className="flex size-full items-center justify-center p-4 text-center font-accent text-xl italic text-faint">No photo yet</span>}
          </div>
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <button type="button" className="btn btn-line mt-3 w-full !min-h-11" disabled={uploading} onClick={() => file.current?.click()}>{uploading ? "Uploading…" : v.image_src ? "Replace photo" : "Upload photo"}</button>
          <label className="field mt-3">Photo description (for screen readers)<input value={v.image_alt} onChange={(e) => set("image_alt", e.target.value)} /></label>
        </div>
        <div className="flex flex-col gap-3 rounded-3xl bg-white p-4">
          {([["published", "Published on the website"], ["featured", "Featured on the home page"], ["beef_only", "Beef and lamb days only"]] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" className="size-5 accent-[#c8361d]" checked={v[k]} onChange={(e) => set(k, e.target.checked)} />{label}</label>
          ))}
        </div>
        <button type="submit" className="btn btn-fire" disabled={pending}>{pending ? "Saving…" : "Save item"}</button>
        {v.id ? <button type="button" className="btn btn-line" onClick={() => { if (confirm(`Delete “${v.name}”? Past orders keep their copy of it.`)) start(async () => { const r = await deleteItem({ id: v.id! }); if (r.ok) router.push("/admin/menu"); else say(r.error, true); }); }}>Delete item</button> : null}
      </div>
      {node}
    </form>
  );
}
