"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Review, StoreSettings } from "@/lib/data/catalog";

export function Reviews({ reviews, settings }: { reviews: Review[]; settings: StoreSettings }) {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || reviews.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % reviews.length), 6000);
    return () => clearInterval(t);
  }, [auto, reviews.length]);

  return (
    <section id="reviews" className="on-dark bg-coal py-20 text-cream md:py-[120px]">
      <div className="wrap grid items-center gap-[30px] md:grid-cols-[0.9fr_1.1fr] md:gap-[70px]">
        <div>
          <p className="eyebrow">Barrie says</p>
          {settings.rating ? <div className="font-display text-[110px] leading-[0.9] text-ember md:text-[160px]">{settings.rating}</div> : null}
          {settings.review_count ? <p className="mt-2.5 text-ash">{settings.review_count} reviews on Google</p> : null}
          <div className="mt-[30px] flex items-center gap-4 rounded-[20px] border border-ember/30 bg-white/5 py-3 pl-3 pr-[18px]">
            <Image src="/photos/readers-choice-2025.jpg" alt="Readers' Choice Awards Best of Barrie 2025 plaque" width={64} height={84} className="h-[84px] w-16 rounded-[10px] object-cover" />
            <div>
              <b className="font-display text-xl font-normal">Readers&apos; Choice 2025</b>
              <br />
              <span className="text-sm text-ash">Best of Barrie</span>
            </div>
          </div>
        </div>
        <div>
          <div className="relative min-h-[280px] md:min-h-[300px]">
            {reviews.map((r, n) => (
              <blockquote
                key={r.id}
                aria-hidden={n !== i}
                className={`absolute inset-0 m-0 transition-all duration-700 ${n === i ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
              >
                <p className="mb-[22px] font-accent text-[28px] italic leading-[1.2] text-cream md:text-[40px]">“{r.quote}”</p>
                <cite className="text-sm not-italic uppercase tracking-[0.14em] text-ash">{r.author} · {r.source}</cite>
              </blockquote>
            ))}
          </div>
          <div role="group" aria-label="Choose review" className="mt-5 flex gap-1.5">
            {reviews.map((r, n) => (
              <button
                key={r.id}
                type="button"
                aria-label={`Show review ${n + 1}`}
                aria-pressed={n === i}
                onClick={() => { setAuto(false); setI(n); }}
                className="flex size-11 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
              >
                <i className={`block h-2.5 rounded-[5px] transition-all duration-500 ${n === i ? "w-[34px] bg-ember" : "w-2.5 bg-[#4a3b31]"}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
