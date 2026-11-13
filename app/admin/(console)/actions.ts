"use server";

import { revalidateTag } from "next/cache";
import sharp from "sharp";
import { z } from "zod";
import { isLive } from "@/lib/env";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { sendOrderMessage } from "@/lib/notify";
import { adminAction, requireStaff, type ActionResult } from "@/lib/security/admin-action";

const bust = () => revalidateTag(CATALOG_TAG);
const uuid = z.uuid();
const must = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

// ───────── orders ─────────
const NEXT: Record<string, string[]> = {
  new: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["picked_up", "cancelled"],
};

export const moveOrder = adminAction(
  z.object({ orderId: uuid, status: z.enum(["preparing", "ready", "picked_up", "cancelled"]) }),
  async ({ supabase }, { orderId, status }) => {
    const { data: cur, error: e1 } = await supabase.from("orders").select("status").eq("id", orderId).single();
    must(e1);
    if (!cur || !NEXT[cur.status]?.includes(status)) throw new Error("That order can't move there.");
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    must(error);
    // The big Ready button tells the customer. Their status page also flips live via the DB broadcast.
    if (status === "ready") await sendOrderMessage(orderId, "order_ready");
  },
);

// ───────── store controls ─────────
export const setPrep = adminAction(z.object({ minutes: z.number().int().min(5).max(120) }), async ({ supabase }, { minutes }) => {
  must((await supabase.from("store_settings").update({ prep_minutes: minutes }).eq("id", true)).error);
  bust();
});

export const setPaused = adminAction(
  z.object({ paused: z.boolean(), message: z.string().trim().min(3).max(160).optional() }),
  async ({ supabase }, { paused, message }) => {
    must((await supabase.from("store_settings").update({ ordering_paused: paused, ...(message ? { pause_message: message } : {}) }).eq("id", true)).error);
    bust();
  },
);

export const setBeefMode = adminAction(z.object({ mode: z.enum(["auto", "on", "off"]) }), async ({ supabase }, { mode }) => {
  must((await supabase.from("store_settings").update({ beef_mode: mode }).eq("id", true)).error);
  bust();
});

export const setBeefDays = adminAction(z.object({ days: z.array(z.number().int().min(0).max(6)).max(7) }), async ({ supabase }, { days }) => {
  must((await supabase.from("beef_schedule").delete().gte("dow", 0)).error);
  if (days.length) must((await supabase.from("beef_schedule").insert([...new Set(days)].map((dow) => ({ dow })))).error);
  bust();
});

export const saveStoreInfo = adminAction(
  z.object({
    tax_rate: z.number().min(0).max(0.3),
    slot_minutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(30)]),
    min_lead_minutes: z.number().int().min(0).max(120),
    rating: z.number().min(0).max(5).nullable(),
    review_count: z.number().int().min(0).nullable(),
    phone: z.string().trim().max(30),
    address: z.string().trim().max(120),
    doordash_url: z.url().or(z.literal("")),
    ubereats_url: z.url().or(z.literal("")),
    instagram_url: z.url().or(z.literal("")),
  }),
  async ({ supabase }, v) => {
    must((await supabase.from("store_settings").update({ ...v, doordash_url: v.doordash_url || null, ubereats_url: v.ubereats_url || null, instagram_url: v.instagram_url || null }).eq("id", true)).error);
    bust();
  },
);

// ───────── menu ─────────
export const toggleSoldOut = adminAction(z.object({ itemId: uuid, soldOut: z.boolean() }), async ({ supabase }, { itemId, soldOut }) => {
  must((await supabase.from("menu_items").update({ sold_out: soldOut }).eq("id", itemId)).error);
  bust();
});

export const toggleModifierSoldOut = adminAction(z.object({ modifierId: uuid, soldOut: z.boolean() }), async ({ supabase }, { modifierId, soldOut }) => {
  must((await supabase.from("modifiers").update({ sold_out: soldOut }).eq("id", modifierId)).error);
  bust();
});

const slug = z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes");
export const saveItem = adminAction(
  z.object({
    id: uuid.optional(),
    category_id: uuid,
    slug,
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(300),
    price_cents: z.number().int().min(0).max(100_000),
    price_is_placeholder: z.boolean(),
    image_src: z.string().max(400).nullable(),
    image_alt: z.string().trim().max(160),
    tags: z.array(z.string().trim().min(1).max(20)).max(5),
    beef_only: z.boolean(),
    featured: z.boolean(),
    published: z.boolean(),
    sort: z.number().int().min(0).max(999),
    group_ids: z.array(uuid).max(10),
  }),
  async ({ supabase }, v) => {
    const { group_ids, id, ...row } = v;
    if (isLive && row.published && row.price_is_placeholder) {
      throw new Error("Confirm the real price before publishing (untick “price is a placeholder”).");
    }
    const saved = id
      ? await supabase.from("menu_items").update(row).eq("id", id).select("id").single()
      : await supabase.from("menu_items").insert(row).select("id").single();
    must(saved.error);
    const itemId = saved.data!.id;
    must((await supabase.from("menu_item_modifier_groups").delete().eq("item_id", itemId)).error);
    if (group_ids.length) must((await supabase.from("menu_item_modifier_groups").insert(group_ids.map((group_id) => ({ item_id: itemId, group_id })))).error);
    bust();
    return { id: itemId };
  },
);

export const deleteItem = adminAction(z.object({ id: uuid }), async ({ supabase }, { id }) => {
  must((await supabase.from("menu_items").delete().eq("id", id)).error);
  bust();
});

export const saveCategory = adminAction(
  z.object({ id: uuid.optional(), slug, name: z.string().trim().min(2).max(40), sort: z.number().int().min(0).max(99), published: z.boolean() }),
  async ({ supabase }, { id, ...row }) => {
    must((id ? await supabase.from("categories").update(row).eq("id", id) : await supabase.from("categories").insert(row)).error);
    bust();
  },
);

export const saveModifierGroup = adminAction(
  z.object({
    id: uuid.optional(),
    name: z.string().trim().min(2).max(40),
    min_select: z.number().int().min(0).max(10),
    max_select: z.number().int().min(1).max(10),
    modifiers: z.array(z.object({ id: uuid.optional(), name: z.string().trim().min(1).max(40), price_delta_cents: z.number().int().min(0).max(5000), price_is_placeholder: z.boolean() })).max(20),
  }),
  async ({ supabase }, { id, modifiers, ...g }) => {
    if (g.max_select < g.min_select) throw new Error("Max can't be below min.");
    const saved = id ? await supabase.from("modifier_groups").update(g).eq("id", id).select("id").single() : await supabase.from("modifier_groups").insert(g).select("id").single();
    must(saved.error);
    const gid = saved.data!.id;
    const keep = modifiers.filter((m) => m.id).map((m) => m.id!);
    const del = supabase.from("modifiers").delete().eq("group_id", gid);
    must((keep.length ? await del.not("id", "in", `(${keep.join(",")})`) : await del).error);
    for (const [i, m] of modifiers.entries()) {
      const row = { group_id: gid, name: m.name, price_delta_cents: m.price_delta_cents, price_is_placeholder: m.price_is_placeholder, sort: i + 1 };
      must((m.id ? await supabase.from("modifiers").update(row).eq("id", m.id) : await supabase.from("modifiers").insert(row)).error);
    }
    bust();
  },
);

export async function uploadItemPhoto(form: FormData): Promise<ActionResult<{ url: string }>> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorised" };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a photo." };
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: "Photo is over 8 MB." };
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) return { ok: false, error: "Use a JPG, PNG, WebP or AVIF." };
  try {
    // Resize and re-encode so food photos arrive web-sized, with metadata stripped.
    const body = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const path = `items/${crypto.randomUUID()}.webp`;
    const { error } = await staff.supabase.storage.from("menu-photos").upload(path, body, { contentType: "image/webp", cacheControl: "31536000" });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { url: staff.supabase.storage.from("menu-photos").getPublicUrl(path).data.publicUrl } };
  } catch {
    return { ok: false, error: "That file isn't a readable image." };
  }
}

// ───────── hours ─────────
const hhmm = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);
export const saveHours = adminAction(
  z.object({ rows: z.array(z.object({ dow: z.number().int().min(0).max(6), is_closed: z.boolean(), opens: hhmm.nullable(), closes: hhmm.nullable() })).length(7) }),
  async ({ supabase }, { rows }) => {
    for (const r of rows) {
      if (!r.is_closed && (!r.opens || !r.closes || r.closes <= r.opens)) throw new Error("Closing time must be after opening time.");
      must((await supabase.from("hours").upsert(r.is_closed ? { dow: r.dow, is_closed: true, opens: null, closes: null } : r)).error);
    }
    bust();
  },
);

export const saveClosure = adminAction(
  z.object({ on_date: z.iso.date(), label: z.string().trim().min(2).max(60), is_closed: z.boolean(), opens: hhmm.nullable(), closes: hhmm.nullable() }),
  async ({ supabase }, v) => {
    must((await supabase.from("closures").upsert(v.is_closed ? { ...v, opens: null, closes: null } : v, { onConflict: "on_date" })).error);
    bust();
  },
);

export const deleteClosure = adminAction(z.object({ id: uuid }), async ({ supabase }, { id }) => {
  must((await supabase.from("closures").delete().eq("id", id)).error);
  bust();
});

// ───────── messages ─────────
export const saveTemplate = adminAction(
  z.object({ key: z.enum(["order_confirmation", "order_ready"]), channel: z.enum(["email", "sms"]), subject: z.string().trim().max(120), body: z.string().trim().min(5).max(1200), enabled: z.boolean() }),
  async ({ supabase }, { key, channel, ...v }) => {
    must((await supabase.from("message_templates").update(v).eq("key", key).eq("channel", channel)).error);
  },
);

// ───────── reviews ─────────
export const saveReview = adminAction(
  z.object({ id: uuid.optional(), quote: z.string().trim().min(5).max(400), author: z.string().trim().min(1).max(60), source: z.string().trim().max(30), verified: z.boolean(), published: z.boolean() }),
  async ({ supabase }, { id, ...v }) => {
    must((id ? await supabase.from("reviews").update(v).eq("id", id) : await supabase.from("reviews").insert(v)).error);
    bust();
  },
);

export const setPublished = adminAction(z.object({ itemId: uuid, published: z.boolean() }), async ({ supabase }, { itemId, published }) => {
  if (isLive && published) {
    const { data } = await supabase.from("menu_items").select("price_is_placeholder").eq("id", itemId).single();
    if (data?.price_is_placeholder) throw new Error("Confirm the real price before publishing.");
  }
  must((await supabase.from("menu_items").update({ published }).eq("id", itemId)).error);
  bust();
});
