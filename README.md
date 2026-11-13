# Shawarma Theory  

Website, pickup ordering and kitchen admin for Shawarma Theory, 510 Bayfield St, Barrie. Next.js 15 (App Router) · Tailwind v4 · Supabase (Postgres, Auth, Realtime, Storage) · Stripe · Resend · Vercel.

See [PLAN.md](PLAN.md) for the design and data model, and [TODO-LIVE.md](TODO-LIVE.md) for what still needs real content and keys.

## Run it (mock mode)

Mock mode needs no outside accounts. Supabase runs locally in Docker; payments, email and texts are simulated.

```bash
brew install colima docker     # once. Any Docker runtime works.
colima start
pnpm install
supabase start -x vector,logflare   # the two excluded containers need the docker socket, which Colima doesn't expose
cp .env.example .env.local          # then fill in the values `supabase status -o env` prints
pnpm db:reset                       # applies migrations and supabase/seed.sql
pnpm dev                            # http://localhost:3000
```

- Admin: `/admin/login` → **Demo login** (seeded owner). The button exists only in mock mode.
- A mock order: add something on `/menu` → Order → pickup details → Pay → fake card page → live status page. Its confirmation email lands in **Admin → Outbox**.
- Seeded items marked **[PRICE]** use placeholder numbers so totals work.

### On your phone (same Wi-Fi)

```bash
pnpm dev:lan
```

It prints a `http://<your-ip>:3000` URL. It points the browser-side Supabase URL at your Mac's LAN IP so live updates reach the phone. Open `/admin` on the Mac in another window and watch orders move both ways.

## Switching to live

1. Create the hosted Supabase project, `supabase link`, `supabase db push`. **Never run `seed.sql` against it.** Create staff users in Supabase Auth and add a `profiles` row for each.
2. Set every variable below in Vercel with `NEXT_PUBLIC_APP_MODE=live`. The build fails fast if a required live variable is missing.
3. Stripe webhook: `https://YOURDOMAIN/api/webhooks/stripe`, events `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
4. Work through [TODO-LIVE.md](TODO-LIVE.md).

Live mode turns on: Stripe Checkout, Resend email (Twilio texts optional), Turnstile, magic-link admin login. It removes the demo button and the mock pay page (both 404/refuse).

## Environment variables

| Variable | Mode | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_MODE` | both | `mock` or `live` |
| `NEXT_PUBLIC_SITE_URL` | both | Used for links in emails, Stripe return URLs, metadata |
| `NEXT_PUBLIC_SUPABASE_URL` | both | Local: `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | both | Public by design; RLS protects the data |
| `SUPABASE_SERVICE_ROLE_KEY` | both | **Secret.** Server only: creates orders, settles payments, logs messages |
| `ORDER_TOKEN_SECRET` | both | **Secret.** 32+ chars. Signs order-status links |
| `DEMO_STAFF_EMAIL`, `DEMO_STAFF_PASSWORD` | mock | Match `supabase/seed.sql`. Unused in live |
| `STRIPE_SECRET_KEY` | live | **Secret.** `sk_test_…` then `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | live | **Secret.** `whsec_…` |
| `RESEND_API_KEY` | live | **Secret** |
| `EMAIL_FROM` | live | A sender on a domain verified in Resend |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | live | Public |
| `TURNSTILE_SECRET_KEY` | live | **Secret** |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | optional | Enables the "ready" text |

Secrets live only in `.env.local` / Vercel. `.env.example` has names only.

## How it fits together

- **Pages:** `/`, `/menu`, `/visit` are static with ISR. Staff edits call `revalidateTag("catalog")`. The live bits (sold-out, prep time, pause, beef banner, open/closed) are small client islands that load Supabase Realtime after the first interaction or a few quiet seconds, and refetch on connect.
- **Orders:** the browser sends only item ids and quantities. The `create_order` database function re-prices everything and is callable only with the service role. An order becomes paid only through `settlePayment` (Stripe webhook, or the mock pay page in mock mode), which checks the amount and ignores replays.
- **Realtime:** the admin board listens to `orders` with the staff JWT (RLS applies). Customers' status pages listen on a broadcast topic named after their secret order token.
- **Security:** RLS on every table; admin pages gated in middleware **and** re-checked in the layout and in every server action (`adminAction`); security headers on every route, a nonce CSP on `/admin`, a static CSP on public pages; honeypot, Turnstile and SQL-backed rate limiting on order creation.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` / `pnpm dev:lan` | Dev server / dev server for phones on your Wi-Fi |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm typecheck`, `pnpm lint` | Types and lint |
| `pnpm db:start`, `db:stop`, `db:reset` | Local Supabase |
| `pnpm test:db` | pgTAP: RLS, pricing, payment idempotency (60 checks) |
| `pnpm test:rls` | Same promises over the real HTTP API as anon and non-staff users |
| `pnpm test:bundle` | Fails if a secret appears in client-facing output (needs `pnpm build`) |
| `pnpm test:e2e` | Playwright: places an order in a phone window, moves it across the admin board in another, checks sold-out, pause and prep time live (needs the stack and `pnpm build`) |
| `pnpm lighthouse` | Mobile Lighthouse on Home and Menu (needs `pnpm start`) |
| `pnpm blur` | Regenerates photo blur placeholders after adding files to `public/photos` |

## Known gaps

- **Lighthouse mobile is 93–94 on Home and Menu with its default throttling, not 95.** Accessibility 98–100, best practices 100, SEO 100, CLS about 0. Run unthrottled (`--throttling-method=provided`) the same page scores 100 with a 0.2 s LCP, so the gap is Lighthouse's slow-4G, 4x-CPU model charging for the render-blocking CSS and framework JS. Tried without gain: smaller hero images, priority images on the first cards, no opacity fades on LCP elements, delaying the realtime client, dropping blur placeholders, fewer font preloads. Worth re-measuring on the real Vercel deployment.
- **Stripe, Resend, Twilio and Turnstile code paths are untested against the real services** (no keys yet). The Stripe webhook signature check, amount check and replay handling are written to spec; run a Stripe test-mode order before launch.
- **Magic-link login** is untested end to end (needs real SMTP).
- Unpublishing an item reaches already-open public pages on their next load or refresh, not instantly (Realtime can't send a row anon can no longer see). Sold-out, prep time, pause, hours and beef changes are instant.
- Sales today counts online pickup orders only.
