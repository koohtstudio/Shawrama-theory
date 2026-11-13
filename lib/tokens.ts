import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";

const HEX = /^[0-9a-f]{64}$/;

function mac(raw: string): string {
  return createHmac("sha256", serverEnv().ORDER_TOKEN_SECRET).update(raw).digest("hex").slice(0, 32);
}

/** `public_token` (random, 244 bits) + HMAC. Forged or mistyped links are rejected before any DB lookup. */
export function signOrderToken(publicToken: string): string {
  return `${publicToken}.${mac(publicToken)}`;
}

export function verifyOrderToken(signed: string): string | null {
  const [raw, sig] = signed.split(".");
  if (!raw || !sig || !HEX.test(raw)) return null;
  const expected = Buffer.from(mac(raw));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return raw;
}

/** Name of the realtime topic for an order. Derived from the secret token, so it is unguessable. */
export const orderTopic = (publicToken: string) => `order:${publicToken}`;

export function signPayload(payload: string): string {
  return createHmac("sha256", serverEnv().ORDER_TOKEN_SECRET).update(`pay:${payload}`).digest("hex");
}
