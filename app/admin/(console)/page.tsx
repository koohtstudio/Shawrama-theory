import { Board } from "@/components/admin/Board";
import { ORDER_SELECT, type BoardOrder } from "@/lib/admin/orders";
import { requireStaff } from "@/lib/security/admin-action";
import { torontoToUtc, torontoParts } from "@/lib/time";

export default async function AdminOrdersPage() {
  const staff = (await requireStaff())!;
  const startOfDay = torontoToUtc(torontoParts().date, 0).toISOString();
  const [orders, settings, items] = await Promise.all([
    staff.supabase.from("orders").select(ORDER_SELECT).in("status", ["new", "preparing", "ready", "picked_up"]).gte("created_at", new Date(Date.now() - 36 * 3600_000).toISOString()).order("created_at"),
    staff.supabase.from("store_settings").select("*").single(),
    staff.supabase.from("menu_items").select("id, name, image_src, sold_out").order("sort"),
  ]);
  const todays = ((orders.data ?? []) as unknown as BoardOrder[]).filter((o) => o.status !== "picked_up" || o.created_at >= startOfDay);
  return <Board initialOrders={todays} initialSettings={settings.data!} initialItems={items.data ?? []} />;
}
