import { unstable_cache } from "next/cache";
import { createStaticClient } from "@/lib/supabase/static";
import type { Database } from "@/lib/database.types";

type T = Database["public"]["Tables"];
export type StoreSettings = T["store_settings"]["Row"];
export type HoursRow = T["hours"]["Row"];
export type ClosureRow = T["closures"]["Row"];
export type Category = T["categories"]["Row"];
export type Review = T["reviews"]["Row"];
export type Modifier = T["modifiers"]["Row"];
export type ModifierGroup = T["modifier_groups"]["Row"] & { modifiers: Modifier[] };
export type MenuItem = T["menu_items"]["Row"] & { groups: ModifierGroup[] };

export type Catalog = {
  settings: StoreSettings;
  beefDays: number[];
  hours: HoursRow[];
  closures: ClosureRow[];
  categories: Category[];
  items: MenuItem[];
  reviews: Review[];
};

export const CATALOG_TAG = "catalog";

/**
 * Everything the public pages need, from the cookie-free anon client (so pages stay static).
 * Tagged: staff edits call revalidateTag(CATALOG_TAG) and the next request rebuilds it.
 */
export const getCatalog = unstable_cache(
  async (): Promise<Catalog> => {
    const db = createStaticClient();
    const [settings, beef, hours, closures, categories, items, groups, links, modifiers, reviews] = await Promise.all([
      db.from("store_settings").select("*").single(),
      db.from("beef_schedule").select("dow"),
      db.from("hours").select("*").order("dow"),
      db.from("closures").select("*").gte("on_date", new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)).order("on_date"),
      db.from("categories").select("*").order("sort"),
      db.from("menu_items").select("*").order("sort"),
      db.from("modifier_groups").select("*").order("sort"),
      db.from("menu_item_modifier_groups").select("*"),
      db.from("modifiers").select("*").order("sort"),
      db.from("reviews").select("*").order("sort"),
    ]);
    for (const r of [settings, beef, hours, closures, categories, items, groups, links, modifiers, reviews]) {
      if (r.error) throw new Error(`catalog query failed: ${r.error.message}`);
    }
    const groupMap = new Map(
      (groups.data ?? []).map((g) => [g.id, { ...g, modifiers: (modifiers.data ?? []).filter((m) => m.group_id === g.id) }] as const),
    );
    return {
      settings: settings.data!,
      beefDays: (beef.data ?? []).map((b) => b.dow),
      hours: hours.data ?? [],
      closures: closures.data ?? [],
      categories: categories.data ?? [],
      items: (items.data ?? []).map((i) => ({
        ...i,
        groups: (links.data ?? [])
          .filter((l) => l.item_id === i.id)
          .map((l) => groupMap.get(l.group_id))
          .filter((g): g is ModifierGroup => !!g)
          .sort((a, b) => a.sort - b.sort),
      })),
      reviews: reviews.data ?? [],
    };
  },
  ["catalog-v1"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);
