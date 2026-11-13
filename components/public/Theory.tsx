import { Photo } from "@/components/ui/Photo";
import { THEORY } from "@/lib/content";

export function Theory() {
  return (
    <section id="theory" className="on-dark -mt-[30px] bg-coal pb-20 pt-[110px] text-cream md:pb-[120px] md:pt-[150px]">
      <div className="wrap">
        <p className="eyebrow">The theory</p>
        <h2 className="h2">Three things, <span className="accent">done properly.</span></h2>
        <div className="mt-[60px] grid gap-10 md:grid-cols-3 md:gap-7">
          {THEORY.map((t, i) => (
            <article key={t.n} className={`flex flex-col gap-[18px] ${i === 1 ? "md:translate-y-[60px]" : ""}`}>
              <div className="relative h-[340px] overflow-hidden rounded-[999px_999px_28px_28px] md:h-[420px]">
                <Photo src={t.photo} alt={t.alt} sizes="(min-width: 768px) 30vw, 90vw" />
              </div>
              <span className="text-[15px] tracking-[0.2em] text-ember">{t.n}</span>
              <h3 className="font-display text-[34px] text-cream">{t.title}</h3>
              <p className="text-base leading-[1.65] text-ash">{t.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
