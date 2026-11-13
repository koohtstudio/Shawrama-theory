import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ItemForm, type ItemFormValue } from "@/components/admin/ItemForm";
import { requireStaff } from "@/lib/security/admin-action";

export const metadata: Metadata = { title: "Edit item" };

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = (await requireStaff())!;
  const [cats, groups] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort"),
    supabase.from("modifier_groups").select("id, name").order("sort"),
  ]);
  const categories = cats.data ?? [];
  let initial: ItemFormValue;
  if (id === "new") {
    initial = { category_id: categories[0]?.id ?? "", slug: "", name: "", description: "", price_cents: 0, price_is_placeholder: true, image_src: null, image_alt: "", tags: [], beef_only: false, featured: false, published: false, sort: 99, group_ids: [] };
  } else {
    const [{ data: item }, { data: links }] = await Promise.all([
      supabase.from("menu_items").select("*").eq("id", id).maybeSingle(),
      supabase.from("menu_item_modifier_groups").select("group_id").eq("item_id", id),
    ]);
    if (!item) notFound();
    initial = { ...item, group_ids: (links ?? []).map((l) => l.group_id) };
  }
  return <ItemForm initial={initial} categories={categories} groups={groups.data ?? []} />;
}
