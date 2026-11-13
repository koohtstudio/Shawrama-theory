import "server-only";
import { render } from "@react-email/render";
import { createElement } from "react";
import { Resend } from "resend";
import { MessageEmail } from "@/emails/MessageEmail";
import { isMock, publicEnv, serverEnv } from "@/lib/env";
import { formatCents } from "@/lib/money";
import { signOrderToken } from "@/lib/tokens";
import { formatInstant } from "@/lib/time";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderTemplate, type TemplateVars } from "./render";

type Channel = "email" | "sms";
type Message = { channel: Channel; to: string; subject: string; body: string; html?: string };
type Sent = { status: "sent" | "failed" | "skipped"; providerId?: string; error?: string };

async function deliver(m: Message): Promise<Sent> {
  // Mock mode: nothing leaves the building. The log row is the "delivery" (see /admin/outbox).
  if (isMock) return { status: "sent", providerId: "mock" };
  const env = serverEnv();
  if (m.channel === "email") {
    const { data, error } = await new Resend(env.RESEND_API_KEY!).emails.send({
      from: env.EMAIL_FROM!,
      to: m.to,
      subject: m.subject,
      html: m.html!,
      text: m.body,
    });
    return error ? { status: "failed", error: error.message } : { status: "sent", providerId: data?.id };
  }
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM) {
    return { status: "skipped", error: "SMS provider not configured" };
  }
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64"),
    },
    body: new URLSearchParams({ To: m.to, From: env.TWILIO_FROM, Body: m.body }),
  });
  const json = (await res.json()) as { sid?: string; message?: string };
  return res.ok ? { status: "sent", providerId: json.sid } : { status: "failed", error: json.message ?? `HTTP ${res.status}` };
}

/** Sends (and logs) every enabled template for this event. Never throws: a failed text must not fail an order. */
export async function sendOrderMessage(orderId: string, key: "order_confirmation" | "order_ready"): Promise<void> {
  try {
    const db = createAdminClient();
    const { data: order } = await db
      .from("orders")
      .select("id, order_no, public_token, pickup_at, asap, total_cents, customers(name, phone, email), order_items(name_snapshot, qty)")
      .eq("id", orderId)
      .single();
    if (!order || !order.customers) return;
    const { data: templates } = await db.from("message_templates").select("*").eq("key", key).eq("enabled", true);
    if (!templates?.length) return;

    const statusUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL}/order/${signOrderToken(order.public_token)}`;
    const vars: TemplateVars = {
      first_name: order.customers.name.trim().split(/\s+/)[0] ?? "there",
      order_no: String(order.order_no),
      pickup_time: order.asap && key === "order_confirmation" ? `in about ${await prepMinutes(db)} min` : formatInstant(new Date(order.pickup_at)),
      total: formatCents(order.total_cents),
      items: order.order_items.map((i) => `${i.qty} x ${i.name_snapshot}`).join("\n"),
      status_url: statusUrl,
    };

    for (const t of templates) {
      const to = t.channel === "email" ? order.customers.email : order.customers.phone;
      if (!to) continue;
      const subject = renderTemplate(t.subject, vars);
      const body = renderTemplate(t.body, vars);
      const html =
        t.channel === "email"
          ? await render(createElement(MessageEmail, { subject, body, ctaLabel: "Track your order", ctaUrl: statusUrl }))
          : undefined;
      const sent: Sent = await deliver({ channel: t.channel, to, subject, body, html }).catch((e: unknown): Sent => ({
        status: "failed",
        error: e instanceof Error ? e.message : "send failed",
      }));
      await db.from("notifications_log").insert({
        order_id: order.id,
        channel: t.channel,
        recipient: to,
        template_key: key,
        subject,
        body,
        status: sent.status,
        provider_id: sent.providerId ?? null,
        error: sent.error ?? null,
      });
    }
  } catch (e) {
    console.error("notify failed", e);
  }
}

async function prepMinutes(db: ReturnType<typeof createAdminClient>): Promise<number> {
  const { data } = await db.from("store_settings").select("prep_minutes").single();
  return data?.prep_minutes ?? 15;
}
