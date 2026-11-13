"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteClosure, saveClosure, saveHours } from "@/app/admin/(console)/actions";
import { DAY_NAMES } from "@/lib/content";
import { useSay } from "./useSay";

type Row = { dow: number; is_closed: boolean; opens: string | null; closes: string | null };
type Closure = { id: string; on_date: string; label: string; is_closed: boolean; opens: string | null; closes: string | null };
const t = (v: string | null) => (v ?? "").slice(0, 5);

export function HoursEditor({ hours, closures }: { hours: Row[]; closures: Closure[] }) {
  const [rows, setRows] = useState(() => [1, 2, 3, 4, 5, 6, 0].map((d) => hours.find((h) => h.dow === d) ?? { dow: d, is_closed: true, opens: null, closes: null }));
  const [c, setC] = useState({ on_date: "", label: "", is_closed: true, opens: "11:00", closes: "17:00" });
  const [pending, start] = useTransition();
  const router = useRouter();
  const { say, node } = useSay();
  const patch = (dow: number, p: Partial<Row>) => setRows((r) => r.map((x) => (x.dow === dow ? { ...x, ...p } : x)));
  return (
    <div className="flex max-w-[760px] flex-col gap-6 px-5 py-6 md:px-8">
      <h1 className="font-display text-[32px]">Hours</h1>
      <section className="flex flex-col gap-2 rounded-3xl bg-white p-5">
        {rows.map((r) => (
          <div key={r.dow} className="flex flex-wrap items-center gap-3 border-b border-dashed border-line py-2 last:border-b-0">
            <b className="w-24">{DAY_NAMES[r.dow]}</b>
            <label className="flex items-center gap-1.5 text-sm font-semibold"><input type="checkbox" className="size-4 accent-[#c8361d]" checked={r.is_closed} onChange={(e) => patch(r.dow, e.target.checked ? { is_closed: true } : { is_closed: false, opens: r.opens ?? "11:00", closes: r.closes ?? "21:00" })} />Closed</label>
            {!r.is_closed ? (<>
              <input aria-label={`${DAY_NAMES[r.dow]} opens`} type="time" className="min-h-10 rounded-xl border border-line px-2" value={t(r.opens)} onChange={(e) => patch(r.dow, { opens: e.target.value })} />
              <span>to</span>
              <input aria-label={`${DAY_NAMES[r.dow]} closes`} type="time" className="min-h-10 rounded-xl border border-line px-2" value={t(r.closes)} onChange={(e) => patch(r.dow, { closes: e.target.value })} />
            </>) : null}
          </div>
        ))}
        <button type="button" className="btn btn-fire mt-3 self-start" disabled={pending} onClick={() => start(async () => { const r = await saveHours({ rows }); say(r.ok ? "Hours saved" : r.error, !r.ok); })}>Save weekly hours</button>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl bg-white p-5">
        <h2 className="font-display text-2xl">Holidays and closures</h2>
        {closures.map((x) => (
          <div key={x.id} className="flex items-center justify-between gap-3 rounded-xl bg-cream px-3.5 py-2.5">
            <span><b>{x.label}</b> · {x.on_date} · {x.is_closed ? "closed" : `${t(x.opens)} to ${t(x.closes)}`}</span>
            <button type="button" className="btn btn-line !min-h-9 !px-4" onClick={() => start(async () => { const r = await deleteClosure({ id: x.id }); if (r.ok) { say("Removed"); router.refresh(); } else say(r.error, true); })}>Remove</button>
          </div>
        ))}
        <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await saveClosure({ on_date: c.on_date, label: c.label, is_closed: c.is_closed, opens: c.is_closed ? null : c.opens, closes: c.is_closed ? null : c.closes }); if (r.ok) { say("Added"); setC({ ...c, on_date: "", label: "" }); router.refresh(); } else say(r.error, true); }); }}>
          <label className="field">Date<input type="date" required value={c.on_date} onChange={(e) => setC({ ...c, on_date: e.target.value })} /></label>
          <label className="field">Label<input required value={c.label} onChange={(e) => setC({ ...c, label: e.target.value })} placeholder="Canada Day" /></label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="size-4 accent-[#c8361d]" checked={c.is_closed} onChange={(e) => setC({ ...c, is_closed: e.target.checked })} />Closed all day</label>
          {!c.is_closed ? <div className="flex items-center gap-2"><input aria-label="Opens" type="time" className="min-h-10 rounded-xl border border-line px-2" value={c.opens} onChange={(e) => setC({ ...c, opens: e.target.value })} /> to <input aria-label="Closes" type="time" className="min-h-10 rounded-xl border border-line px-2" value={c.closes} onChange={(e) => setC({ ...c, closes: e.target.value })} /></div> : <span />}
          <button type="submit" className="btn btn-coal self-start !min-h-11" disabled={pending}>Add closure</button>
        </form>
      </section>
      {node}
    </div>
  );
}
