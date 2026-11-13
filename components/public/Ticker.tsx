import { TICKER } from "@/lib/content";
import { LiveStatusLabel } from "./LiveStatus";

export function Ticker() {
  const set = (k: string) => (
    <span key={k} className="inline-flex items-center gap-10 pr-10 after:size-1.5 after:rounded-full after:bg-ember after:content-['']">
      <LiveStatusLabel fallback="Pickup and delivery in Barrie" />
    </span>
  );
  return (
    <div className="flex h-10 items-center overflow-hidden bg-coal text-[13px] uppercase tracking-[0.08em] text-sand" role="region" aria-label="Today at Shawarma Theory">
      <div className="track whitespace-nowrap">
        {[0, 1].map((n) => (
          <div key={n} className="flex" aria-hidden={n === 1}>
            {set(`s${n}`)}
            {TICKER.map((t) => (
              <span key={t + n} className="inline-flex items-center gap-10 pr-10 after:size-1.5 after:rounded-full after:bg-ember after:content-['']">
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
