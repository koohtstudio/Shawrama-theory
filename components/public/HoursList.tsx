"use client";
import { useLiveStore } from "@/components/live/LiveStore";
import { DAY_NAMES } from "@/lib/content";
import { formatMinutes, parseHHMM, torontoParts } from "@/lib/time";

export function HoursList() {
  const { hours, closures, now } = useLiveStore();
  const today = now ? torontoParts(now) : null;
  const upcoming = closures.filter((c) => !today || c.on_date >= today.date).slice(0, 3);
  return (
    <div>
      {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
        const h = hours.find((x) => x.dow === dow);
        const isToday = today?.dow === dow;
        return (
          <div key={dow} className={`flex justify-between border-b border-dashed border-line py-[13px] last:border-b-0 ${isToday ? "font-bold text-paprika-deep" : ""}`}>
            <span>{DAY_NAMES[dow]}</span>
            <span>{!h || h.is_closed || !h.opens || !h.closes ? "Closed" : `${formatMinutes(parseHHMM(h.opens))} to ${formatMinutes(parseHHMM(h.closes))}`}</span>
          </div>
        );
      })}
      {upcoming.map((c) => (
        <p key={c.id ?? c.on_date} className="mt-3 rounded-xl bg-sand px-3.5 py-2 text-sm font-medium">
          {c.label}, {new Date(`${c.on_date}T12:00:00Z`).toLocaleDateString("en-CA", { month: "long", day: "numeric", timeZone: "UTC" })}: {c.is_closed ? "closed" : "special hours"}
        </p>
      ))}
    </div>
  );
}
