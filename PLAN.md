# Shawarma Theory: build plan

Status: **draft, waiting for "go".** Nothing has been scaffolded or committed yet.

## 0. What I found

**Repo.** `github.com/guraaseessethi/Shawrama-theory` is empty (no refs). This folder is not a git repo yet and `gh` is not signed in. Plan: `git init` here, add the GitHub remote, commit locally in small steps. Pushing needs `gh auth login` (or a credential) from you.

**This folder.**
- `photos/for-website/` has 18 curated food and store photos (≤ ~1200 px wide, Instagram sources). `photos/from-instagram/` has 38 raw ones. They get copied to `public/photos/`.
- `brand/` is empty. The only logo is `_work/logo-crop.png`, a 440 px round crop. Fine for the nav (52 px) and seal (102 px), soft for anything bigger. I'll use it as `public/brand/shawarma-theory-logo.png` until you drop a better one.
- `_work/` is scratch (contact sheet, Instagram zip). Gitignored, never shipped.

**Machine.** Node 22, pnpm 10, Supabase CLI 2.72 are installed. **Docker is not.** `supabase start` (local Postgres, Auth, Realtime, Storage) needs a container runtime, and so do the RLS tests. See decision D1.

**Concept canvas (read in full).** I read `Main`, `Mobile` and `Admin`. What I'm carrying over:
- Tokens: coal `#17120F`, cream `#F5EDE1`, paprika `#C8361D`, ember `#F0882A`, sumac `#7A1E14`. Supporting shades the concept uses: ink `#2A211C`, sand `#EADBC4`, line `#E3D4BF`, muted `#5A4A3F` / `#8A7563`, go-green `#3F8A4E`, and `#B8321B` for red text on cream (the darker red is what passes contrast; `#C8361D` is for fills and large type).
- Layout: scrolling ticker bar, sticky blurred nav, hero with two floating arch photos + rotating seal + CSS embers, tilted marquee, dark "theory" section with three arch cards (middle one offset 60 px), menu tabs, sumac beef/lamb banner, drifting photo strip, dark reviews section with score and plaque, visit card with hours, big outlined footer wordmark.
- Phone: floating pill bottom bar (Home, Menu, Order with count badge, Visit). The cart drawer becomes a bottom sheet.
- Admin: icon rail, top bar with prep stepper and online-ordering switch, KPI row, board, side panel of sold-out switches with the beef toggle on top. Toast on every change.
- Facts in the concept I'll seed but flag as unconfirmed: 510 Bayfield St, Barrie; (705) 721-7774; DoorDash store link; Instagram `theory_shawarma`; hours 11–9 daily, 11–10 Friday; beef and lamb Friday and Sunday; four review quotes.

## 1. Stack, as specified

Next.js 15 (App Router, strict TS, RSC by default, Server Actions for mutations) · Tailwind v4 with CSS-variable tokens · Radix primitives only for Dialog, Tabs, Switch, Toast · Supabase (`@supabase/ssr`) · Zod everywhere · Stripe · Resend + React Email · `lib/notify` (Twilio later) · Vercel · pnpm.

Extras I'd add, all dev-side or tiny: `sharp` (photo resize on upload), Playwright (the two-window live test), `pgTAP` via `supabase test db`.

## 2. Modes and adapters

`NEXT_PUBLIC_APP_MODE=mock|live`, validated once in `lib/env.ts` (Zod; the build fails on a missing live var). Every outside service is one interface with a mock and a live implementation, chosen in one place:

| Adapter | mock | live |
|---|---|---|
| `lib/payments` | fake pay page, signs and posts its own webhook | Stripe Checkout Session + webhook |
| `lib/notify` | writes `notifications_log` (shown in `/admin/outbox`) | Resend email, optional Twilio SMS |
| `lib/captcha` | always passes | Cloudflare Turnstile server verify |
| `lib/ratelimit` | in-memory | Postgres token bucket (SQL function, no new service) |
| `lib/auth` (admin) | "Demo login" button signs in a seeded staff user | magic link, no demo button |
| `lib/supabase/*` | local stack (`127.0.0.1:54321`) | hosted project |

Mock mode still uses **real Supabase Auth, RLS and Realtime** locally. Only the third-party services are faked, so what I test is what ships. Mock "payment" goes through the same `markPaid` code path as the Stripe webhook, so there is no mock-only branch that could hide a bug.

## 3. Data model

Money is integer cents. Times are `timestamptz`; the shop timezone is `America/Toronto`. All tables have RLS on, default deny.

| Table | Key columns | Who can touch it |
|---|---|---|
| `store_settings` (single row) | `prep_minutes`, `ordering_paused`, `pause_message`, `beef_mode` (`auto`/`on`/`off`), `tax_rate` (0.13), `slot_minutes`, `min_lead_minutes`, `rating`, `review_count`, `phone`, `address`, `doordash_url`, `ubereats_url` | anon read; staff write |
| `beef_schedule` | `dow` (0–6) | anon read; staff write |
| `hours` | `dow`, `opens`, `closes` (allows closed days) | anon read; staff write |
| `closures` | `on_date`, `label`, optional `opens`/`closes` override | anon read; staff write |
| `categories` | `slug`, `name`, `sort`, `published` | anon read published; staff write |
| `menu_items` | `category_id`, `slug`, `name`, `description`, `price_cents`, `price_is_placeholder`, `image_src`, `image_alt`, `tags[]`, `beef_only`, `sold_out`, `published`, `sort` | anon read published; staff write |
| `modifier_groups` | `name`, `min_select`, `max_select`, `sort` | anon read; staff write |
| `menu_item_modifier_groups` | `item_id`, `group_id` | anon read; staff write |
| `modifiers` | `group_id`, `name`, `price_delta_cents`, `sold_out`, `sort` | anon read; staff write |
| `customers` | `name`, `phone`, `email` | **staff only** |
| `orders` | `order_no` (sequence), `status`, `payment_status`, `pickup_at`, `asap`, `notes`, `subtotal_cents`, `tax_cents`, `total_cents`, `customer_id`, `public_token`, `idempotency_key` (unique), `stripe_session_id`, `paid_at` | **staff only** (read); inserts only via server (service role) |
| `order_items` | `order_id`, `item_id`, `name_snapshot`, `unit_price_cents`, `qty`, `notes` | staff only |
| `order_item_modifiers` | `order_item_id`, `name_snapshot`, `price_delta_cents` | staff only |
| `message_templates` | `key` (`order_confirmation`, `order_ready`), `channel`, `subject`, `body`, `enabled` | staff only |
| `notifications_log` | `order_id`, `channel`, `to`, `template_key`, `subject`, `body`, `status`, `provider_id` | staff only |
| `reviews` | `quote`, `author`, `source`, `verified`, `published`, `sort` | anon read published; staff write |
| `profiles` | `user_id`, `role` (`owner`/`staff`) | self read; owner write |
| `webhook_events` | `event_id` (pk), `type`, `received_at` | service role only |
| `rate_limits` | `key`, `window_start`, `count` | service role only |

Additions to your starting list: `beef_schedule`, `menu_item_modifier_groups`, `message_templates`, `reviews`, `webhook_events`, `rate_limits`. Reasons: the beef schedule and templates are admin-editable, reviews must be real and swappable, and webhooks need dedupe.

**Order status:** `pending_payment` → `new` → `preparing` ("On the grill") → `ready` → `picked_up`, plus `cancelled`. An order appears on the board only after payment, so `pending_payment` is hidden from staff. Only `markPaid` (called by the webhook) moves it to `new`.

**Beef and lamb today** = `beef_mode = on`, or `auto` and today's day of week is in `beef_schedule`. `beef_only` items are greyed out with "Fri and Sun" otherwise.

**Pricing.** The server action takes `{item_id, qty, modifier_ids[], notes}` only. It reloads every price from the DB, rejects unpublished, sold-out, paused or out-of-hours orders, applies `tax_rate` (Ontario HST 13%), and writes snapshots into `order_items`. Nothing priced by the client is ever read.

### RLS essentials
- A `is_staff()` security-definer function checks `profiles.role in ('owner','staff')` for the signed-in user. Policies call it.
- Anon has `select` only, and only on: published `menu_items`/`categories`, `modifier_groups`, `modifiers`, `hours`, `closures`, `store_settings`, `beef_schedule`, published `reviews`. No insert, update or delete anywhere.
- Every other table has no anon policy at all.
- `profiles` writes are owner-only, so staff can't promote themselves.
- Storage bucket `menu-photos`: public read, write limited to staff.

### Realtime
- **Public site:** `postgres_changes` on `store_settings`, `menu_items`, `modifiers`, `beef_schedule`, `hours`, `closures`, using the anon key (RLS already limits what comes through).
- **Admin board:** `postgres_changes` on `orders` with the staff JWT, so RLS applies. An INSERT event only carries the order row, so the client refetches that one order with its items and customer.
- **Customer status page:** anon can't read `orders`, so a DB trigger on `orders.status` calls `realtime.send(...)` on a topic named after the unguessable token. The payload is `{status, prep_minutes}` and no personal data. A 15-second poll of a token-checked route is the fallback. I'll confirm `realtime.send` behaves on the local stack in step 3 before relying on it.
- **Order tokens:** `public_token` is 192 random bits, delivered as `token.hmac` and verified with `ORDER_TOKEN_SECRET`, so malformed or forged URLs are rejected before any DB lookup.

## 4. Routes

```
Public (static + ISR, revalidated by tag when staff edit)
  /                    Home
  /menu                Menu
  /visit               Hours, map, phone, delivery links
Dynamic
  /order/[token]       Live order status
  /pay/mock/[token]    Fake payment sheet (mock mode only; 404 in live)
  /api/webhooks/stripe       Signature-verified, idempotent
  /api/webhooks/mock-pay     Mock mode only, same handler core
  /api/order-status/[token]  Polling fallback, returns status only
Admin (middleware-protected, dynamic)
  /admin/login
  /admin               Orders board + store controls bar + KPIs
  /admin/menu, /admin/menu/[id]
  /admin/store         Prep, pause, beef mode + schedule
  /admin/hours         Weekly hours + closures
  /admin/messages      Templates, preview, on/off
  /admin/outbox        Mock-mode email/SMS log
  /admin/sales         Sales today
```

## 5. File structure

```
app/
  (public)/{layout,page}.tsx, menu/, visit/, order/[token]/, pay/mock/[token]/
  admin/(auth)/login/
  admin/(console)/{layout,page}.tsx, menu/, store/, hours/, messages/, outbox/, sales/
  api/webhooks/{stripe,mock-pay}/route.ts, api/order-status/[token]/route.ts
  {not-found,error,sitemap,robots,opengraph-image}.tsx
components/
  ui/            Button, Switch, Stepper, Arch, Seal, Embers, Toast
  public/        Nav, Ticker, TabBar, Hero, Theory, Featured, BeefBanner, Strip, Reviews, Plaque, VisitCard, MapFacade
  cart/          CartProvider, CartDrawer, CheckoutForm   (the small client islands)
  live/          LiveStoreProvider (lazy supabase-js), LiveStatusChip, LiveSoldOut
  admin/         Board, OrderCard, StoreBar, MenuEditor, PhotoUpload, HoursEditor, TemplateEditor
lib/
  env.ts  mode.ts  time.ts  money.ts  tokens.ts
  supabase/{server,browser,static,admin,middleware}.ts
  data/{store,menu,hours,reviews}.ts        cached, tagged reads
  orders/{pricing,create,transitions,markPaid}.ts
  payments/{index,stripe,mock}.ts
  notify/{index,resend,twilio,mock,render}.ts
  captcha/  ratelimit/  security/{headers,admin-action}.ts
emails/          OrderConfirmation.tsx, OrderReady.tsx (React Email)
supabase/        config.toml, migrations/*.sql, seed.sql, tests/*.sql
scripts/         dev-lan.ts, test-rls.ts, scan-bundle.ts, make-blur.ts, lighthouse.sh
tests/e2e/       order-flow.spec.ts (two browser contexts)
public/{brand,photos}/
middleware.ts  .env.example  README.md  TODO-LIVE.md  PLAN.md
```

## 6. Decisions that shape the build

**Static pages stay static.** Home, Menu and Visit read through a cookie-free anon client (`lib/supabase/static.ts`), so Next treats them as ISR. Staff edits call `revalidateTag`. "Open now", "ready in ~X min", sold-out, pause and the beef banner are server-rendered with the snapshot, then kept live by a small island. Time-dependent bits (open/closed) are computed on the client in `America/Toronto`, in space reserved at the right size to avoid layout shift.

**Realtime without hurting Lighthouse.** `supabase-js` is loaded with a dynamic import after idle or first interaction, never in the initial bundle. The map is a click-to-load facade (static image, iframe on tap). Embers, ticker, seal and floating arches are transform/opacity CSS only, and all stop under `prefers-reduced-motion`. The hero LCP is the `priority` arch image; I'll make sure the headline reveal doesn't delay it.

**CSP vs ISR.** A nonce-based CSP forces every page dynamic, which would kill the static pages. So: public pages get a header CSP from `next.config` (`'unsafe-inline'` for scripts and styles, plus Stripe, Turnstile, Supabase, and Google Maps only after click). `/admin` gets a strict nonce CSP from middleware, since it's dynamic anyway. Both also set HSTS, `Referrer-Policy`, `X-Content-Type-Options`, `frame-ancestors 'none'` and `Permissions-Policy`. Middleware only matches `/admin/*`, so it never touches the public pages.

**Admin safety by construction.** Every admin mutation is wrapped in `adminAction(schema, handler)`: Zod parse, `supabase.auth.getUser()` (never `getSession`), role check, then handler. A server action can't be written without it. Middleware is a second gate, not the only one.

**Order creation guard rails.** Honeypot field, Turnstile token, rate limit by hashed IP and by phone, and a client-generated idempotency key (unique in the DB), so a double tap can't create two orders. Stripe session creation uses the order id as its idempotency key; webhook events are deduped in `webhook_events`.

**Photos.** `next/image` everywhere with real `sizes`, AVIF/WebP, blur placeholders generated at build. Admin uploads go through a server action: validate type and size, `sharp` resize to 1600 px WebP, then Storage. Seed items point at `/photos/...` so mock mode needs no uploads.

**Phone testing on the same Wi-Fi.** `pnpm dev:lan` starts Next on `0.0.0.0` and points the browser-side Supabase URL at your Mac's LAN IP. Otherwise the phone would try to reach `127.0.0.1` and Realtime would never connect.

**Audio.** Browsers block sound until a tap, so the board has a one-time "Turn on sound" button. The chime is synthesized with Web Audio (no asset); the badge is the tab title count plus `navigator.setAppBadge` where supported.

## 7. Build order (each bullet is one or two commits)

1. **Scaffold.** Next 15, strict TS, Tailwind v4 tokens in CSS variables, `next/font` (Young Serif, Instrument Sans, Instrument Serif), ESLint, Prettier, `lib/env.ts`, `.env.example`, `.gitignore`, photos and logo copied in, blur manifest.
2. **Database.** Migrations for every table, enums, `is_staff()`, RLS policies, realtime publication, status-broadcast trigger, order-number sequence, rate-limit function. Storage bucket. `seed.sql` (menu, modifiers, hours, closures, beef schedule, templates, reviews, demo staff user).
3. **Prove the security first.** `supabase/tests/*.sql` (pgTAP) and `scripts/test-rls.ts` (real anon and staff clients over the API). Cases: anon can't read orders, customers, order items, logs, templates, profiles; anon can't insert, update or delete anything, including prices; unpublished items are invisible; staff can't edit roles; the service-role key never appears in the client bundle (`scan-bundle.ts`). Also confirm `realtime.send` here.
4. **Adapters and core libs.** Env, supabase clients, time (Toronto), money, tokens, payments, notify, captcha, ratelimit, `adminAction`.
5. **Design system and public shell.** Nav, ticker, tab bar, buttons, arch frame, seal, embers, footer.
6. **Home.** All nine sections from your list, in order, on seeded data.
7. **Menu.** Category tabs, item cards, item dialog with add-ons, cart store (persisted), "[PRICE]" handling per D2.
8. **Live public island.** Sold-out, prep chip, pause banner, beef banner, open/closed status.
9. **Checkout.** Drawer steps (cart → pickup time → details → pay), `createOrder` action, mock pay page, `markPaid`, Stripe adapter and webhook, confirmation message.
10. **Order status page.** Token-verified, live via broadcast with polling fallback.
11. **Admin shell and auth.** Demo login, magic link, middleware, layout, KPI strip.
12. **Orders board.** Realtime kanban, new-order chime and badge, big Ready button that fires the "ready" message.
13. **Store controls.** Prep stepper, pause switch, beef mode and schedule.
14. **Menu admin.** Items, categories, prices, add-ons, photo upload, sold-out switch, tag revalidation.
15. **Hours, Messages, Outbox, Sales.**
16. **Visit page, SEO, hardening.** Metadata, Restaurant JSON-LD, sitemap, robots, OG image, 404/error pages, headers pass.
17. **Performance pass.** Lighthouse mobile on `pnpm build && pnpm start`; fix until `/` and `/menu` are 95+.
18. **E2E and docs.** Playwright: place an order in one context, watch it land on the board in another, move it, watch the status page change; flip sold-out, pause and prep and watch the public page. Then `README.md`, `TODO-LIVE.md`.

## 8. Definition of done, and how each one gets proven

| Goal | Proof |
|---|---|
| Full mock order on your phone, live both ways | `pnpm dev:lan` + the Playwright flow |
| Sold-out, pause, prep time live on public site | same Playwright spec |
| RLS holds | `pnpm test:db` (pgTAP) and `pnpm test:rls` (API), both in CI-style output |
| Types and build clean | `pnpm build`, `pnpm typecheck` |
| Lighthouse mobile 95+ on Home and Menu | `scripts/lighthouse.sh`, results pasted into the final report |
| Docs | `README.md` (mock, live, every env var), `TODO-LIVE.md` |

I'll report honestly if any of these is below target, with the number.

## 9. Not in this round
No POS, no delivery handling (DoorDash and Uber Eats stay external links), no tips, no loyalty, no multi-location, no inventory counts. No real keys are ever written by me; `.env.local` is yours.

## 10. Needs your call (my default applies if you just say "go")

**D1. Container runtime (blocker).** Local Supabase and the RLS tests need Docker. None is installed. **Default:** I run `brew install colima docker` (free, CLI-only, no licence prompts), then `colima start`. Alternatives: OrbStack, Docker Desktop, or a hosted Supabase dev project (works, but the "local stack" requirement goes away and I'd need to create a project on your account).

**D2. `[PRICE]` items.** You asked for `[PRICE]` in the seed, but an order total can't be computed from a placeholder. **Default:** items the concept already priced keep those prices; unpriced items get clearly fake numeric prices with `price_is_placeholder = true`, shown in the UI as "[PRICE]" with the demo number only used for the mock total. In live mode the admin refuses to publish a placeholder-priced item. Alternative: literal `[PRICE]` and those items are un-orderable (the demo gets thin).

**D3. Menu categories.** Your list was shawarma, plates, wraps, sides, sauces, drinks. The concept uses Saj wraps, Bowls, Platters, Sides and salads, and has no drinks. **Default:** Saj wraps, Bowls, Platters, Sides and salads, with sauces as the add-on groups and a Drinks category seeded but unpublished until you give me real drinks.

**D4. Reviews and rating.** The concept shows "4.9 · 777 Google reviews". Your Google profile screenshot in `_work/sheet.jpg` reads "5.0 (386)". Those don't match. **Default:** rating and count are `store_settings` fields, seeded with the concept's numbers and flagged in `TODO-LIVE.md`. The four concept quotes are seeded as `verified = false` and listed for you to confirm or replace; I won't write any new ones.

**D5. Stripe flow.** **Default:** Stripe Checkout (hosted redirect). Smallest security surface, Apple Pay and Google Pay come free, no card fields in our CSP. Alternative: Payment Element inside the drawer (nicer feel, more code, more CSP).

**D6. Tax.** **Default:** 13% HST added on top of listed prices (a `store_settings` value). Tell me if your menu prices already include tax.

**D7. Hours.** **Default:** the concept's 11am–9pm daily, Friday to 10pm, flagged as placeholder.

**D8. Where the app lives.** **Default:** this folder is the repo root, `git init`, remote `origin` set to the GitHub URL, nothing pushed until you've signed in with `gh`.
