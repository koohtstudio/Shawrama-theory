"use client";
import { useLiveStore } from "@/components/live/LiveStore";

/** Open/closed text. Empty-but-reserved until mounted so static HTML never carries a stale time. */
export function LiveStatusLabel({ fallback = "Hours below" }: { fallback?: string }) {
  const { status } = useLiveStore();
  return <>{status?.label ?? fallback}</>;
}

export function StatusPill() {
  const { status } = useLiveStore();
  const open = status?.isOpen ?? false;
  return (
    <span className="inline-flex min-h-[44px] items-center gap-2.5 self-start rounded-full bg-cream px-4 font-bold">
      <span aria-hidden className={`size-2.5 rounded-full ${open ? "dot-live bg-go" : "bg-paprika"}`} />
      <span className="min-w-[13ch]">{status?.label ?? "Checking hours…"}</span>
    </span>
  );
}

/** "Ready in ~15 min" / paused / closed. Prep time is live from the staff stepper. */
export function ReadyChip() {
  const { settings, status } = useLiveStore();
  let text: string;
  let tone = "bg-white";
  if (settings.ordering_paused) {
    text = "Online ordering paused";
    tone = "bg-sand";
  } else if (status && !status.isOpen) {
    text = status.label;
  } else {
    text = `Ready in ~${settings.prep_minutes} min`;
  }
  return (
    <span className={`chip min-w-[190px] ${tone}`} aria-live="polite">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8361D" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      <b>{text}</b>
    </span>
  );
}
