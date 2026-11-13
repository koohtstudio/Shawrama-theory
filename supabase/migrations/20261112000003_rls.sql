-- Row Level Security. Default deny; policies below are the complete list of what is allowed.

alter table public.store_settings enable row level security;
alter table public.beef_schedule enable row level security;
alter table public.hours enable row level security;
alter table public.closures enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.modifier_groups enable row level security;
alter table public.menu_item_modifier_groups enable row level security;
alter table public.modifiers enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_modifiers enable row level security;
alter table public.message_templates enable row level security;
alter table public.notifications_log enable row level security;
alter table public.reviews enable row level security;
alter table public.webhook_events enable row level security;
alter table public.rate_limits enable row level security;

-- Defence in depth: strip table grants that the policies should never need to rely on.
revoke all on public.customers, public.orders, public.order_items, public.order_item_modifiers,
  public.message_templates, public.notifications_log, public.profiles,
  public.webhook_events, public.rate_limits from anon;
revoke insert, update, delete, truncate on
  public.store_settings, public.beef_schedule, public.hours, public.closures, public.categories,
  public.menu_items, public.modifier_groups, public.menu_item_modifier_groups, public.modifiers,
  public.reviews from anon;
revoke all on public.webhook_events, public.rate_limits from authenticated;
revoke all on function public.create_order(text, text, text, text, timestamptz, boolean, text, jsonb) from public, anon, authenticated;
revoke all on function public.mark_order_paid(uuid, text, text, int, text) from public, anon, authenticated;
revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.create_order(text, text, text, text, timestamptz, boolean, text, jsonb) to service_role;
grant execute on function public.mark_order_paid(uuid, text, text, int, text) to service_role;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;

-- ── Public catalogue: anyone may read, only published rows where that applies ──
create policy store_settings_read on public.store_settings for select to anon, authenticated using (true);
create policy beef_schedule_read on public.beef_schedule for select to anon, authenticated using (true);
create policy hours_read on public.hours for select to anon, authenticated using (true);
create policy closures_read on public.closures for select to anon, authenticated using (true);
create policy categories_read on public.categories for select to anon, authenticated using (published);
create policy menu_items_read on public.menu_items for select to anon, authenticated
  using (published and exists (select 1 from public.categories c where c.id = category_id and c.published));
create policy modifier_groups_read on public.modifier_groups for select to anon, authenticated using (true);
create policy item_groups_read on public.menu_item_modifier_groups for select to anon, authenticated using (true);
create policy modifiers_read on public.modifiers for select to anon, authenticated using (true);
create policy reviews_read on public.reviews for select to anon, authenticated using (published);

-- ── Staff: full control of the catalogue and store ──
create policy store_settings_staff on public.store_settings for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy beef_schedule_staff on public.beef_schedule for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy hours_staff on public.hours for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy closures_staff on public.closures for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy categories_staff on public.categories for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy menu_items_staff on public.menu_items for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy modifier_groups_staff on public.modifier_groups for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy item_groups_staff on public.menu_item_modifier_groups for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy modifiers_staff on public.modifiers for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy reviews_staff on public.reviews for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ── Private data: staff only. Inserts into orders/customers happen via service-role RPC only ──
create policy customers_staff_read on public.customers for select to authenticated using (public.is_staff());
create policy orders_staff_read on public.orders for select to authenticated using (public.is_staff());
create policy orders_staff_update on public.orders for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy order_items_staff_read on public.order_items for select to authenticated using (public.is_staff());
create policy order_item_mods_staff_read on public.order_item_modifiers for select to authenticated using (public.is_staff());
create policy templates_staff on public.message_templates for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy notifications_staff_read on public.notifications_log for select to authenticated using (public.is_staff());

-- Staff may change order status but nothing about money or ownership.
revoke update on public.orders from authenticated;
grant update (status, notes) on public.orders to authenticated;

-- ── Profiles: read your own, owners manage everyone ──
create policy profiles_self_read on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_owner());
create policy profiles_owner_write on public.profiles for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- webhook_events and rate_limits: RLS on, no policies. Only the service role (which bypasses RLS) can use them.

-- ── Photos bucket ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-photos', 'menu-photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy menu_photos_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-photos' and public.is_staff());
create policy menu_photos_staff_update on storage.objects for update to authenticated
  using (bucket_id = 'menu-photos' and public.is_staff());
create policy menu_photos_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'menu-photos' and public.is_staff());
