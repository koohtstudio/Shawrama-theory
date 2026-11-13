import "server-only";
import { isMock, serverEnv } from "@/lib/env";

/** Cloudflare Turnstile. Stubbed (always passes) in mock mode. */
export async function verifyCaptcha(token: string | undefined, ip: string | null): Promise<boolean> {
  if (isMock) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret: serverEnv().TURNSTILE_SECRET_KEY!, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}
