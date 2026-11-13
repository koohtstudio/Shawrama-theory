import type { Metadata } from "next";
import { HoursEditor } from "@/components/admin/HoursEditor";
import { requireStaff } from "@/lib/security/admin-action";

export const metadata: Metadata = { title: "Hours" };

export default async function HoursPage() {
  const { supabase } = (await requireStaff())!;
  const [h, c] = await Promise.all([
    supabase.from("hours").select("*").order("dow"),
    supabase.from("closures").select("*").gte("on_date", new Date().toISOString().slice(0, 10)).order("on_date"),
  ]);
  return <HoursEditor hours={h.data ?? []} closures={c.data ?? []} />;
}
