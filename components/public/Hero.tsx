import Image from "next/image";
import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import type { StoreSettings } from "@/lib/data/catalog";
import { ReadyChip } from "./LiveStatus";

export function Hero({ settings }: { settings: StoreSettings }) {
  return (
    <section className="wrap grid items-center gap-[30px] pb-[60px] pt-[30px] md:grid-cols-[1.05fr_1fr] md:gap-[60px] md:pb-20 md:pt-14">
      <div>
        <div className="anim-up d1 flex flex-wrap gap-2.5">
          {settings.rating ? (
            <span className="chip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#F0882A" aria-hidden>
                <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
              </svg>
              <b>{settings.rating}</b> · {settings.review_count} Google reviews
            </span>
          ) : null}
          <span className="chip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8361D" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="9" r="6" />
              <path d="M8.5 14l-1.5 7 5-3 5 3-1.5-7" />
            </svg>
            Readers&apos; Choice 2025
          </span>
          <ReadyChip />
        </div>
        <h1 className="mb-6 mt-[26px] font-display text-[54px] leading-[0.95] tracking-[-0.02em] text-coal md:text-[96px]">
          <span className="reveal"><span>Made with</span></span>
          <span className="reveal r2"><span>passion.</span></span>
          <span className="reveal r3"><span className="accent">Proven by taste.</span></span>
        </h1>
        <p className="anim-up d2 mb-[34px] max-w-[520px] text-[17px] leading-[1.6] text-muted md:text-xl">
          Saj bread baked fresh in-house. Chicken marinated for 24 hours and grilled. Every sauce made from scratch. Right here on Bayfield.
        </p>
        <div className="anim-up d3 flex flex-wrap gap-3">
          <Link href="/menu" className="btn btn-fire">
            Order for pickup
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link href="/menu" className="btn btn-line">See the menu</Link>
        </div>
      </div>

      <div className="anim-up d1 relative h-[440px] md:h-[640px]">
        <div className="arch-float-a absolute left-[6%] top-0 h-[92%] w-[58%] overflow-hidden rounded-[999px_999px_28px_28px] shadow-[0_40px_70px_-40px_rgba(23,18,15,0.7)]">
          <Photo src="/photos/wraps-in-hand.jpg" alt="Two loaded chicken shawarma saj wraps held up to the camera" sizes="(min-width: 768px) 30vw, 60vw" priority />
        </div>
        <div className="arch-float-b absolute bottom-[2%] right-0 h-[52%] w-[40%] overflow-hidden rounded-[28px_28px_999px_999px] shadow-[0_40px_70px_-40px_rgba(23,18,15,0.7)]">
          <Photo src="/photos/beef-steaks-shawarma.jpg" alt="Beef shawarma being carved off the spit" sizes="(min-width: 768px) 20vw, 40vw" />
        </div>
        <div aria-hidden className="absolute right-0 top-0 size-[120px] md:right-[6%] md:top-[6%] md:size-[170px]">
          <svg viewBox="0 0 170 170" className="spin-slow size-full">
            <defs>
              <path id="seal-ring" d="M85,85 m-66,0 a66,66 0 1,1 132,0 a66,66 0 1,1 -132,0" />
            </defs>
            <circle cx="85" cy="85" r="84" fill="#17120F" />
            <text fontFamily="var(--font-instrument-sans), sans-serif" fontWeight="700" fontSize="13" letterSpacing="4.2" fill="#F5EDE1">
              <textPath href="#seal-ring">SAJ · SHAWARMA · FALAFEL · HUMMUS · </textPath>
            </text>
          </svg>
          <Image src="/brand/shawarma-theory-logo.png" alt="" width={102} height={102} className="absolute inset-6 size-[72px] rounded-full md:inset-[34px] md:size-[102px]" />
        </div>
        <span aria-hidden className="ember absolute bottom-[6%] left-[30%] size-2 rounded-full bg-ember" />
        <span aria-hidden className="ember absolute bottom-[4%] left-[42%] size-1.5 rounded-full bg-ember [animation-delay:1.3s]" />
        <span aria-hidden className="ember absolute bottom-[10%] left-[22%] size-[5px] rounded-full bg-paprika [animation-delay:2.4s]" />
      </div>
    </section>
  );
}
