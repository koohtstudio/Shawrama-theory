import Image from "next/image";
import Link from "next/link";

export function Footer({ phone, instagram }: { phone: string | null; instagram: string | null }) {
  return (
    <footer className="overflow-hidden bg-coal pb-[130px] pt-20 text-ash">
      {/* The wordmark is wider than the screen, so it runs left to right like a conveyor belt. */}
      <div aria-hidden className="mb-10 overflow-hidden">
        <div className="track track-reverse track-wordmark">
          {[0, 1].map((n) => (
            <div key={n} className="flex">
              {[0, 1].map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-8 whitespace-nowrap pr-8 font-display text-[64px] leading-[0.95] tracking-[-0.03em] text-transparent transition-colors duration-500 [-webkit-text-stroke:1.5px_#4a3b31] after:size-3 after:rotate-45 after:rounded-[3px] after:bg-paprika after:content-[''] hover:text-paprika hover:[-webkit-text-stroke-color:#c8361d] md:gap-16 md:pr-16 md:text-[200px] md:after:size-6"
                >
                  Shawarma Theory
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="wrap">
        <div className="flex flex-wrap items-center justify-between gap-8 text-cream">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image src="/brand/shawarma-theory-logo.png" alt="" width={52} height={52} className="size-[52px] rounded-full" />
            <b className="text-[15px] font-bold tracking-[0.2em]">SHAWARMA &amp; SAJ BAKERY</b>
          </Link>
          <div className="flex flex-wrap gap-[22px] [&_a]:text-cream [&_a]:no-underline [&_a:hover]:text-ember">
            <Link href="/menu">Menu</Link>
            <Link href="/visit">Visit</Link>
            {instagram ? <a href={instagram} rel="noopener noreferrer">Instagram</a> : null}
            {phone ? <a href={`tel:${phone.replace(/\D/g, "")}`}>{phone}</a> : null}
          </div>
          <span className="text-[13px]">© {new Date().getFullYear()} Shawarma Theory</span>
        </div>
      </div>
    </footer>
  );
}
