import type { Metadata } from "next";
import { isMock } from "@/lib/env";
import { requireStaff } from "@/lib/security/admin-action";

export const metadata: Metadata = { title: "Outbox" };

export default async function OutboxPage() {
  const { supabase } = (await requireStaff())!;
  const { data } = await supabase.from("notifications_log").select("*").order("created_at", { ascending: false }).limit(50);
  return (
    <div className="flex max-w-[860px] flex-col gap-4 px-5 py-6 md:px-8">
      <h1 className="font-display text-[32px]">Outbox</h1>
      <p className="text-muted">{isMock ? "Demo mode: emails and texts are not sent. They land here instead, exactly as the customer would see them." : "Every message the site has sent, with its delivery status."}</p>
      {(data ?? []).length === 0 ? <p className="rounded-3xl bg-white p-6 text-faint">Nothing yet. Place an order and its confirmation appears here.</p> : null}
      {(data ?? []).map((m) => (
        <article key={m.id} className="rounded-3xl bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-faint">
            <span><b className="uppercase tracking-[0.12em] text-paprika-deep">{m.channel}</b> · {m.template_key.replace("_", " ")} · to {m.recipient}</span>
            <span>{new Date(m.created_at).toLocaleString("en-CA", { timeZone: "America/Toronto", dateStyle: "medium", timeStyle: "short" })} · {m.status}</span>
          </div>
          {m.subject ? <p className="mt-2 font-bold">{m.subject}</p> : null}
          <p className="mt-1.5 whitespace-pre-line leading-[1.55] text-ink">{m.body}</p>
          {m.error ? <p className="mt-2 text-sm font-semibold text-sumac">{m.error}</p> : null}
        </article>
      ))}
    </div>
  );
}
