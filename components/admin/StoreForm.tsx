"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveReview, saveStoreInfo, setBeefDays, setBeefMode, setPaused } from "@/app/admin/(console)/actions";
import type { Review, StoreSettings } from "@/lib/data/catalog";
import { DAY_NAMES } from "@/lib/content";
import { Switch } from "./Switch";
import { useSay } from "./useSay";

export function StoreForm({ settings, beefDays, reviews }: { settings: StoreSettings; beefDays: number[]; reviews: Review[] }) {
  const [s, setS] = useState(settings);
  const [days, setDays] = useState(beefDays);
  const [msg, setMsg] = useState(settings.pause_message);
  const [tax, setTax] = useState(String(Number(settings.tax_rate) * 100));
  const [pending, start] = useTransition();
  const router = useRouter();
  const { say, node } = useSay();
  const f = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setS((p) => ({ ...p, [k]: v }));

  return (
    <div className="flex max-w-[860px] flex-col gap-6 px-5 py-6 md:px-8">
      <h1 className="font-display text-[32px]">Store controls</h1>

      <section className="flex flex-col gap-3 rounded-3xl bg-white p-5">
        <h2 className="font-display text-2xl">Pause online orders</h2>
        <label className="flex items-center gap-3 font-semibold"><Switch label="Online ordering" checked={!s.ordering_paused} onCheckedChange={(on) => { f("ordering_paused", !on); start(async () => { const r = await setPaused({ paused: !on, message: msg }); say(r.ok ? (on ? "Ordering is back on" : "Ordering paused") : r.error, !r.ok); }); }} />{s.ordering_paused ? "Paused" : "Taking orders"}</label>
        <label className="field">Message shown while paused<input value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={160} /></label>
        <button type="button" className="btn btn-line self-start !min-h-11" onClick={() => start(async () => { const r = await setPaused({ paused: s.ordering_paused, message: msg }); say(r.ok ? "Message saved" : r.error, !r.ok); })}>Save message</button>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl bg-white p-5">
        <h2 className="font-display text-2xl">Beef and lamb days</h2>
        <div role="radiogroup" aria-label="Beef mode" className="flex gap-2">
          {([["auto", "Follow schedule"], ["on", "Force on"], ["off", "Force off"]] as const).map(([m, label]) => (
            <button key={m} type="button" role="radio" aria-checked={s.beef_mode === m} className={`min-h-11 flex-1 cursor-pointer rounded-full border-[1.5px] text-sm font-semibold ${s.beef_mode === m ? "border-coal bg-coal text-cream" : "border-line bg-white"}`} onClick={() => { f("beef_mode", m); start(async () => { const r = await setBeefMode({ mode: m }); say(r.ok ? "Beef mode saved" : r.error, !r.ok); }); }}>{label}</button>
          ))}
        </div>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 text-sm font-semibold text-muted">Schedule</legend>
          {DAY_NAMES.map((d, i) => (
            <label key={d} className={`flex min-h-11 cursor-pointer items-center rounded-full border-[1.5px] px-4 text-sm font-semibold ${days.includes(i) ? "border-coal bg-coal text-cream" : "border-line"}`}>
              <input type="checkbox" className="sr-only" checked={days.includes(i)} onChange={(e) => setDays((p) => (e.target.checked ? [...p, i] : p.filter((x) => x !== i)))} />{d}
            </label>
          ))}
        </fieldset>
        <button type="button" className="btn btn-line self-start !min-h-11" onClick={() => start(async () => { const r = await setBeefDays({ days }); say(r.ok ? "Schedule saved" : r.error, !r.ok); })}>Save schedule</button>
      </section>

      <form className="flex flex-col gap-4 rounded-3xl bg-white p-5" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await saveStoreInfo({ tax_rate: Number(tax) / 100, slot_minutes: s.slot_minutes as 15, min_lead_minutes: s.min_lead_minutes, rating: s.rating === null ? null : Number(s.rating), review_count: s.review_count, phone: s.phone ?? "", address: s.address ?? "", doordash_url: s.doordash_url ?? "", ubereats_url: s.ubereats_url ?? "", instagram_url: s.instagram_url ?? "" }); say(r.ok ? "Saved" : r.error, !r.ok); }); }}>
        <h2 className="font-display text-2xl">Shop details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field">Sales tax (%)<input inputMode="decimal" value={tax} onChange={(e) => setTax(e.target.value)} /></label>
          <label className="field">Pickup slot length<select value={s.slot_minutes} onChange={(e) => f("slot_minutes", Number(e.target.value))}>{[5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n} min</option>)}</select></label>
          <label className="field">Minimum lead time (min)<input type="number" value={s.min_lead_minutes} onChange={(e) => f("min_lead_minutes", Number(e.target.value))} /></label>
          <label className="field">Phone<input value={s.phone ?? ""} onChange={(e) => f("phone", e.target.value)} /></label>
          <label className="field md:col-span-2">Address<input value={s.address ?? ""} onChange={(e) => f("address", e.target.value)} /></label>
          <label className="field">Google rating<input inputMode="decimal" value={s.rating ?? ""} onChange={(e) => f("rating", e.target.value === "" ? null : (Number(e.target.value) as never))} /></label>
          <label className="field">Google review count<input type="number" value={s.review_count ?? ""} onChange={(e) => f("review_count", e.target.value === "" ? null : Number(e.target.value))} /></label>
          <label className="field md:col-span-2">DoorDash link<input value={s.doordash_url ?? ""} onChange={(e) => f("doordash_url", e.target.value)} /></label>
          <label className="field md:col-span-2">Uber Eats link<input value={s.ubereats_url ?? ""} onChange={(e) => f("ubereats_url", e.target.value)} /></label>
          <label className="field md:col-span-2">Instagram link<input value={s.instagram_url ?? ""} onChange={(e) => f("instagram_url", e.target.value)} /></label>
        </div>
        <button type="submit" className="btn btn-fire self-start" disabled={pending}>Save details</button>
      </form>

      <section className="flex flex-col gap-4 rounded-3xl bg-white p-5">
        <h2 className="font-display text-2xl">Reviews on the home page</h2>
        <p className="text-sm text-muted">Only tick “verified” once you have checked the quote against the original review.</p>
        {[...reviews, { id: undefined, quote: "", author: "", source: "Google", verified: false, published: true, sort: 99 } as unknown as Review].map((r, i) => <ReviewRow key={r.id ?? `new-${i}`} r={r} onSaved={() => { say("Saved"); router.refresh(); }} onError={(m) => say(m, true)} />)}
      </section>
      {node}
    </div>
  );
}

function ReviewRow({ r, onSaved, onError }: { r: Review; onSaved: () => void; onError: (m: string) => void }) {
  const [v, setV] = useState(r);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line p-3">
      <textarea aria-label="Review quote" rows={2} className="rounded-xl border border-line p-2.5" placeholder="Paste a real review here" value={v.quote} onChange={(e) => setV({ ...v, quote: e.target.value })} />
      <div className="flex flex-wrap items-center gap-3">
        <input aria-label="Author" className="min-h-10 w-40 rounded-xl border border-line px-3" placeholder="Ben S." value={v.author} onChange={(e) => setV({ ...v, author: e.target.value })} />
        <input aria-label="Source" className="min-h-10 w-28 rounded-xl border border-line px-3" value={v.source} onChange={(e) => setV({ ...v, source: e.target.value })} />
        <label className="flex items-center gap-1.5 text-sm font-semibold"><input type="checkbox" className="size-4 accent-[#c8361d]" checked={v.verified} onChange={(e) => setV({ ...v, verified: e.target.checked })} />verified</label>
        <label className="flex items-center gap-1.5 text-sm font-semibold"><input type="checkbox" className="size-4 accent-[#c8361d]" checked={v.published} onChange={(e) => setV({ ...v, published: e.target.checked })} />shown</label>
        <button type="button" className="btn btn-coal ml-auto !min-h-10" disabled={pending || v.quote.trim().length < 5 || !v.author.trim()} onClick={() => start(async () => { const x = await saveReview({ id: r.id, quote: v.quote, author: v.author, source: v.source, verified: v.verified, published: v.published }); if (x.ok) onSaved(); else onError(x.error); })}>Save</button>
      </div>
    </div>
  );
}
