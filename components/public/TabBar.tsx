"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

const icon = (d: React.ReactNode) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);

export function TabBar() {
  const path = usePathname();
  const { count, setOpen } = useCart();
  const tab = (href: string, label: string, svg: React.ReactNode) => (
    <Link
      href={href}
      aria-current={path === href ? "page" : undefined}
      className={`flex min-h-[54px] flex-1 flex-col items-center justify-center gap-[3px] rounded-full text-[11px] font-semibold no-underline ${path === href ? "text-white" : "text-ash"}`}
    >
      {svg}
      {label}
    </Link>
  );
  return (
    <nav aria-label="Quick menu" className="fixed inset-x-3 bottom-3 z-40 flex h-[70px] items-center justify-around rounded-full bg-coal px-2 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)] md:hidden">
      {tab("/", "Home", icon(<path d="M4 11l8-7 8 7v9H4z" />))}
      {tab("/menu", "Menu", icon(<path d="M5 4h14v16H5zM9 9h6M9 13h6" />))}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[52px] flex-[1.4] items-center justify-center gap-2 rounded-full bg-paprika text-sm font-semibold text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 7h12l1 13H5L6 7z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
        Order
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ember px-1.5 text-[10px] font-bold text-coal">{count}</span>
      </button>
      {tab("/visit", "Visit", icon(<><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>))}
    </nav>
  );
}
