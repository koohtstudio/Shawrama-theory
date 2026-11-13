// Runs the dev server so a phone on the same Wi-Fi can use it, including live updates.
// The browser-side Supabase URL must point at this Mac's LAN IP, not 127.0.0.1.
import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";

function lanIp(): string | undefined {
  const all = Object.entries(networkInterfaces()).flatMap(([name, list]) => (list ?? []).map((i) => ({ name, ...i })));
  const v4 = all.filter((i) => i.family === "IPv4" && !i.internal);
  return (v4.find((i) => i.name === "en0") ?? v4[0])?.address;
}

const ip = lanIp();
if (!ip) {
  console.error("No LAN address found. Connect to Wi-Fi and retry.");
  process.exit(1);
}
const port = process.env.PORT ?? "3000";
const supa = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321");
supa.hostname = ip;
console.log(`\n  Phone:  http://${ip}:${port}\n  Admin:  http://${ip}:${port}/admin/login\n`);
const child = spawn("pnpm", ["exec", "next", "dev", "-H", "0.0.0.0", "-p", port], {
  stdio: "inherit",
  env: {
    ...process.env,
    DEV_LAN_IP: ip,
    NEXT_PUBLIC_SITE_URL: `http://${ip}:${port}`,
    NEXT_PUBLIC_SUPABASE_URL: supa.origin,
  },
});
child.on("exit", (code) => process.exit(code ?? 0));
