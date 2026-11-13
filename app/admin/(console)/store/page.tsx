import type { Metadata } from "next";
import { StoreForm } from "@/components/admin/StoreForm";
import type { Review } from "@/lib/data/catalog";
import { requireStaff } from "@/lib/security/admin-action";

export const metadata: Metadata = { title: "Store" };

export default async function StorePage() {
  const { supabase } = (await requireStaff())!;
  const [s, b, r] = await Promise.all([
    supabase.from("store_settings").select("*").single(),
    supabase.from("beef_schedule").select("dow"),
    supabase.from("reviews").select("*").order("sort"),
  ]);
  return <StoreForm settings={s.data!} beefDays={(b.data ?? []).map((x) => x.dow)} reviews={(r.data ?? []) as Review[]} />;
}
