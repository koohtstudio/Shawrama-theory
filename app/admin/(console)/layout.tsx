import Image from "next/image";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/admin/(auth)/actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireStaff } from "@/lib/security/admin-action";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  if (!staff) {
    // Signed in but not staff (or no session): end the session and bounce to login.
    redirect("/admin/login");
  }
  return (
    <div className="flex min-h-dvh flex-col bg-cream md:flex-row">
      <aside className="flex flex-none items-center gap-2 bg-coal p-2 md:w-[88px] md:flex-col md:py-[18px]">
        <Image src="/brand/shawarma-theory-logo.png" alt="Shawarma Theory" width={52} height={52} className="size-[44px] rounded-full md:mb-3.5 md:size-[52px]" />
        <AdminNav />
        <form action={signOut} className="ml-auto md:ml-0 md:mt-auto">
          <button type="submit" className="min-h-11 cursor-pointer rounded-2xl bg-transparent px-3 text-[11px] font-semibold text-[#a8957f] hover:text-cream">Sign out</button>
        </form>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
