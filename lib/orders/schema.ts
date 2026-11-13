import { z } from "zod";

export const orderInputSchema = z.object({
  idempotencyKey: z.string().min(16).max(64),
  name: z.string().trim().min(2, "Add your name").max(80),
  phone: z.string().trim().regex(/^[\d\s()+.-]{7,20}$/, "Enter a phone number we can text"),
  email: z.email("Enter a valid email").max(120),
  notes: z.string().trim().max(300).default(""),
  pickup: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("asap") }),
    z.object({ kind: z.literal("slot"), at: z.iso.datetime() }),
  ]),
  lines: z
    .array(
      z.object({
        itemId: z.uuid(),
        qty: z.number().int().min(1).max(20),
        modifierIds: z.array(z.uuid()).max(12),
      }),
    )
    .min(1, "Your order is empty")
    .max(30),
  website: z.string().max(0).optional(), // honeypot: real people leave this empty
  captchaToken: z.string().max(4096).optional(),
});

export type OrderInput = z.input<typeof orderInputSchema>;
export type PlaceOrderResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined>; code?: "paused" | "closed" | "unavailable" };
