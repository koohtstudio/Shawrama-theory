"use client";
import dynamic from "next/dynamic";
import { useCart } from "./CartProvider";

// The drawer (Radix, Zod, form logic) loads the first time someone opens their order.
const CartDrawer = dynamic(() => import("./CartDrawer").then((m) => m.CartDrawer), { ssr: false });

export function CartDrawerLoader() {
  const { open } = useCart();
  return open ? <CartDrawer /> : null;
}
