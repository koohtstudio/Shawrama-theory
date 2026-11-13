import type { Metadata } from "next";
import { MenuAdmin } from "@/components/admin/MenuAdmin";
import { requireStaff } from "@/lib/security/admin-action";

export const metadata: Metadata = { title: "Menu" };

export default async function AdminMenuPage() {
  const { supabase } = (await requireStaff())!;
  const [cats, items] = await Promise.all([
    supabase.from("categories").select("id, slug, name, sort, published").order("sort"),
    supabase.from("menu_items").select("id, category_id, name, price_cents, price_is_placeholder, image_src, sold_out, published").order("sort"),
  ]);
  return <MenuAdmin categories={cats.data ?? []} items={items.data ?? []} />;
}
