import Image from "next/image";
import Link from "next/link";
import { NavCart } from "./NavCart";

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/#theory", label: "Our theory" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/visit", label: "Visit" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur-[14px]">
      <div className="wrap flex h-[66px] items-center justify-between gap-5 md:h-20">
        <Link href="/" aria-label="Shawarma Theory home" className="group flex items-center gap-3 text-coal no-underline">
          <Image
            src="/brand/shawarma-theory-logo.png"
            alt=""
            width={52}
            height={52}
            priority
            className="size-[42px] rounded-full transition-transform duration-700 group-hover:-rotate-[14deg] group-hover:scale-105 md:size-[52px]"
          />
          <b className="text-xs font-bold tracking-[0.2em] md:text-[15px]">SHAWARMA THEORY</b>
        </Link>
        <nav aria-label="Main" className="hidden gap-1.5 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-4 py-2.5 text-[15px] font-medium text-ink no-underline transition hover:bg-coal hover:text-cream">
              {l.label}
            </Link>
          ))}
        </nav>
        <NavCart />
      </div>
    </header>
  );
}
