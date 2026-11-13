-- Shawarma Theory: core schema. Money is integer cents. Shop timezone: America/Toronto.

create type public.app_role as enum ('owner', 'staff');
create type public.beef_mode as enum ('auto', 'on', 'off');
create type public.order_status as enum ('pending_payment', 'new', 'preparing', 'ready', 'picked_up', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.notify_channel as enum ('email', 'sms');
create type public.notify_status as enum ('queued', 'sent', 'failed', 'skipped');

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ───────────── store ─────────────
create table public.store_settings (
  id boolean primary key default true check (id),
  prep_minutes int not null default 15 check (prep_minutes between 5 and 120),
  ordering_paused boolean not null default false,
  pause_message text not null default 'Kitchen''s slammed, back soon. Check back in a few minutes.',
  beef_mode public.beef_mode not null default 'auto',
  tax_rate numeric(5,4) not null default 0.13 check (tax_rate >= 0 and tax_rate < 1),
  slot_minutes int not null default 15 check (slot_minutes in (5, 10, 15, 20, 30)),
  min_lead_minutes int not null default 10,
  rating numeric(2,1),
  review_count int,
  phone text,
  address text,
  maps_url text,
  doordash_url text,
  ubereats_url text,
  instagram_url text,
  updated_at timestamptz not null default now()
);
create trigger store_settings_touch before update on public.store_settings
  for each row execute function public.touch_updated_at();

create table public.beef_schedule (
  dow int primary key check (dow between 0 and 6)  -- 0 = Sunday
);

create table public.hours (
  dow int primary key check (dow between 0 and 6),
  is_closed boolean not null default false,
  opens time,
  closes time,
  check (is_closed or (opens is not null and closes is not null and closes > opens))
);

create table public.closures (
  id uuid primary key default gen_random_uuid(),
  on_date date not null unique,
  label text not null,
  is_closed boolean not null default true,
  opens time,
  closes time,
  check (is_closed or (opens is not null and closes is not null and closes > opens))
);

-- ───────────── menu ─────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  sort int not null default 0,
  published boolean not null default true
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  description text not null default '',
  price_cents int not null check (price_cents >= 0),
  price_is_placeholder boolean not null default false,
  image_src text,
  image_alt text not null default '',
  tags text[] not null default '{}',
  beef_only boolean not null default false,
  featured boolean not null default false,
  sold_out boolean not null default false,
  published boolean not null default true,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);
create index menu_items_category_idx on public.menu_items (category_id, sort);
create trigger menu_items_touch before update on public.menu_items
  for each row execute function public.touch_updated_at();

create table public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  min_select int not null default 0 check (min_select >= 0),
  max_select int not null default 1 check (max_select >= 1),
  sort int not null default 0,
  check (max_select >= min_select)
);

create table public.menu_item_modifier_groups (
  item_id uuid not null references public.menu_items(id) on delete cascade,
  group_id uuid not null references public.modifier_groups(id) on delete cascade,
  primary key (item_id, group_id)
);

create table public.modifiers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.modifier_groups(id) on delete cascade,
  name text not null,
  price_delta_cents int not null default 0 check (price_delta_cents >= 0),
  price_is_placeholder boolean not null default false,
  sold_out boolean not null default false,
  sort int not null default 0
);
create index modifiers_group_idx on public.modifiers (group_id, sort);

-- ───────────── people ─────────────
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'staff',
  display_name text,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now()
);

-- ───────────── orders ─────────────
create sequence public.order_no_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no int not null unique default nextval('public.order_no_seq'),
  public_token text not null unique
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  idempotency_key text not null unique,
  status public.order_status not null default 'pending_payment',
  payment_status public.payment_status not null default 'pending',
  customer_id uuid not null references public.customers(id),
  pickup_at timestamptz not null,
  asap boolean not null default true,
  notes text not null default '',
  subtotal_cents int not null default 0,
  tax_cents int not null default 0,
  total_cents int not null default 0,
  stripe_session_id text,
  paid_at timestamptz,
  ready_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on public.orders (status, created_at);
create index orders_paid_at_idx on public.orders (paid_at);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_id uuid references public.menu_items(id) on delete set null,
  name_snapshot text not null,
  unit_price_cents int not null,
  qty int not null check (qty between 1 and 20),
  notes text not null default ''
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  modifier_id uuid references public.modifiers(id) on delete set null,
  name_snapshot text not null,
  price_delta_cents int not null
);
create index order_item_modifiers_idx on public.order_item_modifiers (order_item_id);

-- ───────────── messaging ─────────────
create table public.message_templates (
  key text not null check (key in ('order_confirmation', 'order_ready')),
  channel public.notify_channel not null,
  subject text not null default '',
  body text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (key, channel)
);

create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  channel public.notify_channel not null,
  recipient text not null,
  template_key text not null,
  subject text not null default '',
  body text not null,
  status public.notify_status not null default 'queued',
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);
create index notifications_log_created_idx on public.notifications_log (created_at desc);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author text not null,
  source text not null default 'Google',
  verified boolean not null default false,
  published boolean not null default true,
  sort int not null default 0
);

-- ───────────── plumbing (server-only) ─────────────
create table public.webhook_events (
  event_id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count int not null default 0
);
