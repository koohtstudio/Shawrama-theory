"use client";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

export function NavCart() {
  const { count, setOpen } = useCart();
  return (
    <div className="hidden gap-2.5 md:flex">
      <button type="button" className="btn btn-line" onClick={() => setOpen(true)} aria-label={`Open your order, ${count} items`}>
        Order
        <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-ember px-1.5 text-xs font-bold text-coal">{count}</span>
      </button>
      <Link href="/menu" className="btn btn-fire">Order pickup</Link>
    </div>
  );
}
