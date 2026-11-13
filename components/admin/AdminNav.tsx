"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/store", label: "Store" },
  { href: "/admin/hours", label: "Hours" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/outbox", label: "Outbox" },
  { href: "/admin/sales", label: "Sales" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto md:flex-col">
      {links.map((l) => {
        const on = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined} className={`flex min-h-11 items-center justify-center rounded-2xl px-3 text-[11px] font-semibold no-underline transition md:min-h-[54px] md:w-16 ${on ? "bg-paprika text-white" : "text-[#a8957f] hover:bg-ink hover:text-cream"}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
