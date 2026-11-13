import { MARQUEE } from "@/lib/content";

export function Marquee() {
  return (
    <div aria-hidden className="relative z-[2] -mx-5 -rotate-[1.4deg] overflow-hidden bg-coal py-[22px] text-cream md:py-[26px]">
      <div className="track track-mid">
        {[0, 1].map((n) => (
          <div key={n} className="flex">
            {MARQUEE.map((t) => (
              <span key={t + n} className="inline-flex items-center gap-[46px] pr-[46px] font-display text-[32px] after:size-4 after:rotate-45 after:rounded-[4px] after:bg-paprika after:content-[''] md:text-[52px]">
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
