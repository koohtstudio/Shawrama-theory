"use client";
import { Dialog } from "radix-ui";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { placeOrder } from "@/app/(public)/actions";
import { useLiveStore } from "@/components/live/LiveStore";
import { Photo } from "@/components/ui/Photo";
import { isMock } from "@/lib/env";
import { formatCents } from "@/lib/money";
import { orderInputSchema } from "@/lib/orders/schema";
import { asapPickup, buildSlots } from "@/lib/time";
import { useCart } from "./CartProvider";
import { Turnstile } from "./Turnstile";

export function CartDrawer() {
  const { open, setOpen, lines, count, subtotalCents, setQty, clear } = useCart();
  const { settings, hours, closures, now } = useLiveStore();
  const [step, setStep] = useState<"cart" | "details">("cart");
  const [pickup, setPickup] = useState<"asap" | string>("asap");
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "", website: "" });
  const [token, setToken] = useState<string>();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, start] = useTransition();
  const keyRef = useRef<{ sig: string; key: string }>({ sig: "", key: "" });
  const onToken = useCallback((t: string) => setToken(t), []);

  const slotData = useMemo(
    () => (now ? buildSlots({ now, hours, closures, prepMinutes: settings.prep_minutes, slotMinutes: settings.slot_minutes, minLeadMinutes: settings.min_lead_minutes }) : null),
    [now, hours, closures, settings.prep_minutes, settings.slot_minutes, settings.min_lead_minutes],
  );
  const asapOk = now ? asapPickup(now, settings.prep_minutes, hours, closures) !== null : false;
  const effectivePickup = pickup === "asap" && !asapOk ? slotData?.slots[0]?.value ?? "asap" : pickup;

  const tax = Math.round(subtotalCents * Number(settings.tax_rate));
  const total = subtotalCents + tax;
  const paused = settings.ordering_paused;
  const canCheckout = count > 0 && !paused;
  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const sig = JSON.stringify(lines.map((l) => [l.itemId, l.qty, l.modifierIds]));
    if (keyRef.current.sig !== sig) keyRef.current = { sig, key: crypto.randomUUID() };
    const payload = {
      idempotencyKey: keyRef.current.key,
      name: form.name,
      phone: form.phone,
      email: form.email,
      notes: form.notes,
      website: form.website,
      captchaToken: token,
      pickup: effectivePickup === "asap" ? ({ kind: "asap" } as const) : ({ kind: "slot", at: effectivePickup } as const),
      lines: lines.map((l) => ({ itemId: l.itemId, qty: l.qty, modifierIds: l.modifierIds })),
    };
    const parsed = orderInputSchema.safeParse(payload);
    if (!parsed.success) {
      const fe: Record<string, string[]> = {};
      for (const i of parsed.error.issues) (fe[String(i.path[0])] ??= []).push(i.message);
      setFieldErrors(fe);
      return;
    }
    setFieldErrors({});
    start(async () => {
      const res = await placeOrder(payload);
      if (res.ok) {
        clear();
        window.location.assign(res.redirectUrl);
      } else {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        if (res.code === "unavailable") setStep("cart");
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay fixed inset-0 z-[55] bg-coal/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="drawer-up md:drawer-right fixed bottom-0 right-0 z-[60] flex h-[92dvh] w-full flex-col rounded-t-[28px] bg-cream shadow-[-30px_0_60px_-30px_rgba(0,0,0,0.45)] md:top-0 md:h-full md:w-[440px] md:rounded-none"
        >
          <div className="flex items-center justify-between border-b border-line px-[26px] py-[22px]">
            <div>
              <p className="eyebrow !mb-1">{step === "cart" ? "Pickup order" : "Almost there"}</p>
              <Dialog.Title className="font-display text-[28px]">{step === "cart" ? (count ? `${count} ${count === 1 ? "item" : "items"}` : "Your order") : "Pickup details"}</Dialog.Title>
            </div>
            <Dialog.Close className="flex size-11 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-coal bg-transparent text-coal" aria-label="Close order">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
            </Dialog.Close>
          </div>

          {paused ? (
            <p role="alert" className="mx-[26px] mt-4 rounded-2xl bg-sumac px-4 py-3 text-sm font-semibold text-cream">{settings.pause_message}</p>
          ) : null}

          {step === "cart" ? (
            <>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-[26px] py-5">
                {count === 0 ? (
                  <div className="flex flex-col items-center gap-3.5 px-1 py-8 text-center">
                    <p className="font-display text-[26px]">Nothing yet</p>
                    <p className="text-muted">Add a wrap or a bowl to get started.</p>
                    <a href="/menu" className="btn btn-coal" onClick={() => setOpen(false)}>Go to the menu</a>
                  </div>
                ) : (
                  lines.map((l) => (
                    <div key={l.key} className="flex items-center gap-3 rounded-[18px] bg-white p-2.5">
                      {l.image ? (
                        <div className="relative size-14 flex-none overflow-hidden rounded-[14px]"><Photo src={l.image} alt="" sizes="56px" /></div>
                      ) : (
                        <span className="size-14 flex-none rounded-[14px] bg-sand" />
                      )}
                      <div className="min-w-0 flex-1">
                        <b className="block font-display text-[17px] font-normal">{l.name}</b>
                        {l.modifierNames.length ? <small className="block truncate text-muted">{l.modifierNames.join(", ")}</small> : null}
                        <small className="text-faint">{l.placeholderPrice ? "[PRICE]" : formatCents(l.unitCents * l.qty)}</small>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" aria-label={`One less ${l.name}`} onClick={() => setQty(l.key, l.qty - 1)} className="size-9 cursor-pointer rounded-full border border-[#d7c5ae] bg-cream">−</button>
                        <span className="min-w-5 text-center font-bold">{l.qty}</span>
                        <button type="button" aria-label={`One more ${l.name}`} onClick={() => setQty(l.key, Math.min(20, l.qty + 1))} className="size-9 cursor-pointer rounded-full border border-[#d7c5ae] bg-cream">+</button>
                      </div>
                    </div>
                  ))
                )}
                {error ? <p role="alert" className="rounded-xl bg-sand px-3.5 py-2.5 text-sm font-semibold text-sumac">{error}</p> : null}
              </div>
              <div className="flex flex-col gap-3 border-t border-line px-[26px] pb-[26px] pt-5">
                <Totals subtotal={subtotalCents} tax={tax} total={total} rate={Number(settings.tax_rate)} />
                <button type="button" className="btn btn-fire" disabled={!canCheckout} onClick={() => { setError(""); setStep("details"); }}>
                  {paused ? "Ordering paused" : "Choose pickup time"}
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
              <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-[26px] py-5">
                <div className="field">
                  <span id="pickup-label">Pickup</span>
                  <div role="radiogroup" aria-labelledby="pickup-label" className="flex flex-wrap gap-2">
                    {asapOk ? <Slot on={effectivePickup === "asap"} onClick={() => setPickup("asap")}>ASAP, about {settings.prep_minutes} min</Slot> : null}
                    {slotData?.slots.slice(0, 24).map((s) => (
                      <Slot key={s.value} on={effectivePickup === s.value} onClick={() => setPickup(s.value)}>
                        {s.label}
                      </Slot>
                    ))}
                    {now && !asapOk && !slotData?.slots.length ? <p className="text-sm font-medium text-sumac">We&apos;re closed and have no pickup times to offer right now.</p> : null}
                  </div>
                  {slotData && !slotData.isToday && slotData.slots.length ? <small className="font-medium text-faint">Today is done, so these are for {slotData.date}.</small> : null}
                </div>
                <label className="field">Name<input type="text" autoComplete="name" placeholder="First and last" {...field("name")} aria-invalid={!!fieldErrors.name} /><Err e={fieldErrors.name} /></label>
                <label className="field">Phone, for the ready text<input type="tel" autoComplete="tel" placeholder="705 555 0123" {...field("phone")} aria-invalid={!!fieldErrors.phone} /><Err e={fieldErrors.phone} /></label>
                <label className="field">Email, for your receipt<input type="email" autoComplete="email" placeholder="you@email.com" {...field("email")} aria-invalid={!!fieldErrors.email} /><Err e={fieldErrors.email} /></label>
                <label className="field">Notes for the kitchen<textarea rows={2} placeholder="Extra garlic, no pickles…" {...field("notes")} /></label>
                {/* Honeypot: invisible to people, tempting to bots. */}
                <div aria-hidden className="absolute -left-[9999px] size-0 overflow-hidden">
                  <label>Website<input type="text" tabIndex={-1} autoComplete="off" {...field("website")} /></label>
                </div>
                <Turnstile onToken={onToken} />
                {error ? <p role="alert" className="rounded-xl bg-sand px-3.5 py-2.5 text-sm font-semibold text-sumac">{error}</p> : null}
              </div>
              <div className="flex flex-col gap-3 border-t border-line px-[26px] pb-[26px] pt-5">
                <Totals subtotal={subtotalCents} tax={tax} total={total} rate={Number(settings.tax_rate)} />
                <button type="submit" className="btn btn-fire" disabled={!canCheckout || pending || (!asapOk && !slotData?.slots.length)}>
                  {pending ? "Placing order…" : `Pay ${formatCents(total)}`}
                </button>
                <button type="button" className="btn btn-line" onClick={() => setStep("cart")}>Back</button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );

  function Totals({ subtotal, tax, total, rate }: { subtotal: number; tax: number; total: number; rate: number }) {
    return (
      <div className="flex flex-col gap-1 text-[15px]">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCents(subtotal)}</span></div>
        <div className="flex justify-between text-muted"><span>HST ({Math.round(rate * 100)}%)</span><span>{formatCents(tax)}</span></div>
        <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCents(total)}</span></div>
        {isMock ? <p className="text-xs text-faint">Demo mode: prices marked [PRICE] use placeholder amounts and no card is charged.</p> : null}
      </div>
    );
  }
}

function Slot({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick} className={`min-h-11 cursor-pointer rounded-full border-[1.5px] px-4 text-sm font-semibold ${on ? "border-coal bg-coal text-cream" : "border-line bg-white text-coal"}`}>
      {children}
    </button>
  );
}

function Err({ e }: { e?: string[] }) {
  return e?.length ? <small role="alert" className="font-medium text-sumac">{e[0]}</small> : null;
}
