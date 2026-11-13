export const ORDER_SELECT =
  "id, order_no, status, payment_status, pickup_at, asap, notes, total_cents, created_at, customers(name, phone), order_items(name_snapshot, qty, order_item_modifiers(name_snapshot))";

export type BoardOrder = {
  id: string;
  order_no: number;
  status: "pending_payment" | "new" | "preparing" | "ready" | "picked_up" | "cancelled";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  pickup_at: string;
  asap: boolean;
  notes: string;
  total_cents: number;
  created_at: string;
  customers: { name: string; phone: string } | null;
  order_items: { name_snapshot: string; qty: number; order_item_modifiers: { name_snapshot: string }[] }[];
};
