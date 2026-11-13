# TODO before going live

Everything below is a stand-in or an account you still need. Nothing here needs code changes except where noted.

## Content you provide
- [ ] **Real menu and prices.** Every item marked "[PRICE]" in the admin (Menu) is a placeholder. Untick "price is a placeholder" per item; live mode refuses to publish placeholder prices. Add-on prices (Menu → Add-ons) are placeholders too.
- [ ] **Drinks** category is seeded but hidden. Add real drinks and publish it, or delete it.
- [ ] **Menu photos.** 18 photos from Instagram are in `public/photos/` (max ~1200 px wide). Items without a photo show a "Photo goes here" tile. Upload originals in Admin → Menu → item → Upload photo. Hero photos look best from originals.
- [ ] **Real reviews.** The 4 quotes were carried over from the design concept and are marked unverified. Check each against the original, then edit them in Admin → Store → Reviews. Paste real ones; don't invent any.
- [ ] **Google rating and count.** Seeded as 4.9 / 777 from the concept, but the Google profile screenshot showed 5.0 / 386. Set the real numbers in Admin → Store.
- [ ] **Hours.** Seeded as 11am–9pm daily, Friday to 10pm. Set real hours and holiday closures in Admin → Hours. The Christmas Day closure is a placeholder.
- [ ] **Beef and lamb days.** Seeded as Friday and Sunday (from Instagram). Confirm in Admin → Store.
- [ ] **Tax.** Seeded as 13% HST added on top of menu prices. Confirm whether your prices include tax (Admin → Store).
- [ ] **Logo.** `public/brand/shawarma-theory-logo.png` is a 440 px crop. Replace with a high-resolution file (same filename), and `app/icon.png` for the favicon.
- [ ] **Delivery links.** DoorDash link is from the concept; the Uber Eats link is just `ubereats.com`. Set the real store URLs in Admin → Store.
- [ ] Phone, address, Instagram: check in Admin → Store.

## Accounts and keys (add to `.env.local` and Vercel by hand)
- [ ] **Supabase project** (hosted). Link it, then `supabase db push`. Do **not** run `seed.sql` against it (it has a demo login). Create real staff users in Supabase Auth, then insert a row into `profiles` for each (`role` = `owner` or `staff`).
- [ ] **Supabase Auth** → URL Configuration: set Site URL to your domain and add `https://YOURDOMAIN/admin/auth/callback` as a redirect URL. Use custom SMTP (Resend works) so magic-link emails actually arrive.
- [ ] **Stripe**: create the account, use test keys first (`STRIPE_SECRET_KEY`), then live keys.
- [ ] **Stripe webhook URL**: `https://YOURDOMAIN/api/webhooks/stripe` with events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.
- [ ] **Resend**: API key (`RESEND_API_KEY`), verify your sending domain, set `EMAIL_FROM`.
- [ ] **Cloudflare Turnstile**: site key and secret (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`).
- [ ] **Twilio** (optional, for texts): `TWILIO_*` vars, then turn the "ready" text template on in Admin → Messages.
- [ ] **Domain**: point it at Vercel, set `NEXT_PUBLIC_SITE_URL`.
- [ ] **Vercel**: add every variable in `.env.example`, with `NEXT_PUBLIC_APP_MODE=live`.
- [ ] Unset `DEMO_STAFF_*` in live. The demo button is also hidden and refused when the mode is `live`.
