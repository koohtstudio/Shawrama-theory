import { Photo } from "@/components/ui/Photo";
import { STRIP } from "@/lib/content";

export function Strip() {
  return (
    <div className="pause-on-hover overflow-hidden" role="region" aria-label="Photos from the kitchen">
      <div className="track track-slow gap-4 py-2.5">
        {[0, 1].map((n) => (
          <div key={n} className="flex gap-4" aria-hidden={n === 1}>
            {STRIP.map((p, i) => (
              <div
                key={p.src + n}
                className={`relative h-[220px] flex-none overflow-hidden md:h-[300px] ${i % 3 === 1 ? "w-[240px] md:w-[330px]" : "w-[180px] md:w-[240px]"} ${i % 3 === 0 ? "rounded-[999px_999px_24px_24px]" : "rounded-3xl"}`}
              >
                <Photo src={p.src} alt={n === 0 ? p.alt : ""} sizes="330px" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
