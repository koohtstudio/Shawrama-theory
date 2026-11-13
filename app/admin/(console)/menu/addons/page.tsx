import type { Metadata } from "next";
import { AddonsEditor, type GroupValue } from "@/components/admin/AddonsEditor";
import { requireStaff } from "@/lib/security/admin-action";

export const metadata: Metadata = { title: "Add-ons" };

export default async function AddonsPage() {
  const { supabase } = (await requireStaff())!;
  const [g, m] = await Promise.all([
    supabase.from("modifier_groups").select("*").order("sort"),
    supabase.from("modifiers").select("*").order("sort"),
  ]);
  const groups: GroupValue[] = (g.data ?? []).map((x) => ({
    id: x.id, name: x.name, min_select: x.min_select, max_select: x.max_select,
    modifiers: (m.data ?? []).filter((y) => y.group_id === x.id).map((y) => ({ id: y.id, name: y.name, price: (y.price_delta_cents / 100).toFixed(2), placeholder: y.price_is_placeholder, sold_out: y.sold_out })),
  }));
  return <AddonsEditor groups={groups} />;
}
