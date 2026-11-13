"use client";
import { useState, useTransition } from "react";
import { saveTemplate } from "@/app/admin/(console)/actions";
import { renderTemplate, SAMPLE_VARS } from "@/lib/notify/render";
import { Switch } from "./Switch";
import { useSay } from "./useSay";

export type Template = { key: "order_confirmation" | "order_ready"; channel: "email" | "sms"; subject: string; body: string; enabled: boolean };
const TITLES = { order_confirmation: "Order confirmation", order_ready: "Your order is ready" } as const;

export function TemplateEditor({ templates }: { templates: Template[] }) {
  return (
    <div className="flex max-w-[980px] flex-col gap-6 px-5 py-6 md:px-8">
      <h1 className="font-display text-[32px]">Messages</h1>
      <p className="max-w-[62ch] text-muted">Customers get these automatically. Use {"{{first_name}}"}, {"{{order_no}}"}, {"{{pickup_time}}"}, {"{{total}}"}, {"{{items}}"} and {"{{status_url}}"}. Previews use sample data.</p>
      {templates.map((t) => <Card key={`${t.key}-${t.channel}`} initial={t} />)}
    </div>
  );
}

function Card({ initial }: { initial: Template }) {
  const [t, setT] = useState(initial);
  const [pending, start] = useTransition();
  const { say, node } = useSay();
  const persist = (next: Template, ok: string) => start(async () => { const r = await saveTemplate(next); say(r.ok ? ok : r.error, !r.ok); });
  return (
    <section className="grid gap-5 rounded-3xl bg-white p-5 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">{TITLES[t.key]} <span className="text-base text-faint">· {t.channel === "email" ? "Email" : "Text"}</span></h2>
          <Switch label={`${TITLES[t.key]} ${t.channel} on`} checked={t.enabled} onCheckedChange={(v) => { const n = { ...t, enabled: v }; setT(n); persist(n, v ? "Turned on" : "Turned off"); }} />
        </div>
        {t.channel === "email" ? <label className="field">Subject<input value={t.subject} onChange={(e) => setT({ ...t, subject: e.target.value })} /></label> : null}
        <label className="field">Message<textarea rows={t.channel === "email" ? 8 : 4} value={t.body} onChange={(e) => setT({ ...t, body: e.target.value })} /></label>
        <button type="button" className="btn btn-coal self-start !min-h-11" disabled={pending} onClick={() => persist(t, "Saved")}>Save</button>
      </div>
      <div aria-label="Preview" className={t.enabled ? "" : "opacity-50"}>
        <p className="eyebrow">Preview</p>
        {t.channel === "email" ? (
          <div className="overflow-hidden rounded-2xl bg-cream p-3">
            <div className="overflow-hidden rounded-2xl bg-white">
              <div className="bg-coal px-5 py-4 text-[13px] font-bold tracking-[0.2em] text-cream">SHAWARMA THEORY</div>
              <div className="p-5">
                <p className="mb-3 text-sm font-bold text-faint">Subject: {renderTemplate(t.subject, SAMPLE_VARS)}</p>
                {renderTemplate(t.body, SAMPLE_VARS).split(/\n{2,}/).map((p, i) => <p key={i} className="mb-3 whitespace-pre-line leading-[1.6]">{p}</p>)}
                <span className="inline-block rounded-full bg-paprika px-5 py-3 text-sm font-semibold text-white">Track your order</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[22px] bg-[#e9e9ee] p-4"><p className="ml-auto max-w-[85%] whitespace-pre-line rounded-[18px] bg-[#2b8cff] px-4 py-2.5 text-white">{renderTemplate(t.body, SAMPLE_VARS)}</p></div>
        )}
      </div>
      {node}
    </section>
  );
}
