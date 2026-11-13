"use client";
import Image from "next/image";
import { useLiveStore } from "@/components/live/LiveStore";
import { DAY_NAMES } from "@/lib/content";
import { torontoParts } from "@/lib/time";

/** Beef and lamb days. Driven by the schedule + manual override; flips live when staff toggle it. */
export function BeefBanner({ className = "" }: { className?: string }) {
  const { beefToday, beefDays, now, settings } = useLiveStore();
  const days = [...beefDays].sort((a, b) => a - b).map((d) => DAY_NAMES[d]);
  let chip = "";
  if (beefToday) chip = "On today";
  else if (now) {
    const dow = torontoParts(now).dow;
    const next = [...beefDays].map((d) => ({ d, away: (d - dow + 7) % 7 || 7 })).sort((a, b) => a.away - b.away)[0];
    chip = settings.beef_mode === "off" ? "Not today" : next ? `Next: ${DAY_NAMES[next.d]}` : "";
  }
  const when = days.length ? days.join(" and ") : "select days";
  return (
    <div className={`relative flex flex-wrap items-center gap-[18px] overflow-hidden rounded-[22px] bg-sumac px-[22px] py-4 text-cream ${className}`}>
      <Image src="/photos/beef-steaks-shawarma.jpg" alt="" width={64} height={64} className="size-16 flex-none rounded-full border-2 border-ember object-cover" />
      <div className="min-w-[200px] flex-1">
        <b className="block font-display text-[22px] font-normal">Beef and lamb day</b>
        <span className="text-[15px] text-sand">Beef and lamb shawarma on the spit every {when}, while it lasts.</span>
      </div>
      <span className={`inline-flex min-h-[38px] min-w-[120px] items-center justify-center rounded-full px-4 text-sm font-bold ${beefToday ? "bg-ember text-coal" : "bg-cream/15 text-cream"}`} aria-live="polite">
        {chip || " "}
      </span>
    </div>
  );
}
