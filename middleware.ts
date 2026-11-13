import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Runs only for /admin. Public pages stay static, so they never touch middleware.
export async function middleware(req: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const u = new URL(supabaseUrl);
  const ws = `${u.protocol === "https:" ? "wss" : "ws"}://${u.host}`;
  const dev = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${u.origin}`,
    "font-src 'self'",
    `connect-src 'self' ${u.origin} ${ws}`,
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("Cache-Control", "no-store");

  const { userId, isStaff } = await updateSession(req, res);
  const path = req.nextUrl.pathname;
  const open = path === "/admin/login" || path === "/admin/auth/callback";
  if (!isStaff && !open) return NextResponse.redirect(new URL("/admin/login", req.url));
  if (isStaff && path === "/admin/login") return NextResponse.redirect(new URL("/admin", req.url));
  // The layout and every server action re-check the role too (see requireStaff): middleware is the second gate, not the only one.
  void userId;
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
