// Fails if any secret value or secret variable name appears in files that are sent to browsers.
import { config } from "dotenv";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

config({ path: ".env.local" });
// Client-facing output only: static chunks, public files, and prerendered pages (.html/.rsc).
// Server-only code under .next/server may legitimately mention variable names.
const roots = [".next/static", ".next/server/app", "public"].filter((p) => { try { return statSync(p).isDirectory(); } catch { return false; } });
const secrets = ["SUPABASE_SERVICE_ROLE_KEY", "ORDER_TOKEN_SECRET", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "RESEND_API_KEY", "TWILIO_AUTH_TOKEN", "TURNSTILE_SECRET_KEY"];
const values = secrets.map((k) => process.env[k]).filter((v): v is string => !!v && v.length > 12);
const needles = [...secrets, ...values, "sk_live_", "sk_test_", "whsec_"];

function* walk(dir: string): Generator<string> {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (dir.startsWith(".next/server") ? /\.(html|rsc)$/.test(f) : /\.(js|css|html|rsc|json|map|txt)$/.test(f)) yield p;
  }
}
let hits = 0, files = 0;
for (const r of roots) for (const f of walk(r)) {
  files++;
  const text = readFileSync(f, "utf8");
  for (const n of needles) if (text.includes(n)) { console.log(`LEAK  ${f} contains ${n.length > 14 ? n.slice(0, 6) + "…" : n}`); hits++; }
}
console.log(hits ? `\n${hits} leak(s) found` : `Scanned ${files} files: no secrets in client-facing output`);
process.exit(hits ? 1 : 0);
