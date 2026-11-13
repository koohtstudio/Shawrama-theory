import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const supabase = new URL(supabaseUrl);
const supabaseWs = `${supabase.protocol === "https:" ? "wss" : "ws"}://${supabase.host}`;

// Public pages are static (ISR), so they cannot use per-request nonces. They get a header CSP;
// /admin is dynamic and gets a strict nonce-based CSP from middleware.ts instead.
const publicCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://challenges.cloudflare.com https://js.stripe.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase.origin}`,
  "font-src 'self'",
  `connect-src 'self' ${supabase.origin} ${supabaseWs} https://challenges.cloudflare.com`,
  "frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com https://www.google.com/maps/",
  "form-action 'self' https://checkout.stripe.com",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: process.env.DEV_LAN_IP ? [process.env.DEV_LAN_IP] : [],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 414, 640, 828, 1080, 1280, 1600],
    imageSizes: [64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: supabase.protocol.replace(":", "") as "http" | "https",
        hostname: supabase.hostname,
        port: supabase.port,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: baseHeaders },
      // Everything except /admin gets the static CSP.
      { source: "/((?!admin).*)", headers: [{ key: "Content-Security-Policy", value: publicCsp }] },
    ];
  },
};

export default config;
