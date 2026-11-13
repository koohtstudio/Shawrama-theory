"use client";
import { useCart } from "@/components/cart/CartProvider";

export function Toast() {
  const { toast } = useCart();
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-[104px] left-1/2 z-[70] -translate-x-1/2 rounded-full bg-coal px-[22px] py-[13px] text-sm font-semibold text-cream transition-all duration-500 md:bottom-7 ${
        toast ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      {toast || " "}
    </div>
  );
}
