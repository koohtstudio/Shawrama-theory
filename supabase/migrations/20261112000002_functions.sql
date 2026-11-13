-- Helpers used by RLS and by server-only RPCs.

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid()) and p.role in ('owner', 'staff')
  );
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid()) and p.role = 'owner'
  );
$$;

-- Beef and lamb today? Manual override first, otherwise the weekly schedule (Toronto time).
create or replace function public.beef_today() returns boolean
language sql stable set search_path = '' as $$
  select case s.beef_mode
    when 'on' then true
    when 'off' then false
    else exists (
      select 1 from public.beef_schedule b
      where b.dow = extract(dow from (now() at time zone 'America/Toronto'))::int
    )
  end
  from public.store_settings s limit 1;
$$;

-- Server-only. Re-prices everything from the database; the client only sends ids and quantities.
create or replace function public.create_order(
  p_idempotency_key text,
  p_name text,
  p_phone text,
  p_email text,
  p_pickup_at timestamptz,
  p_asap boolean,
  p_notes text,
  p_lines jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_existing public.orders;
  v_settings public.store_settings;
  v_customer_id uuid;
  v_order public.orders;
  v_line jsonb;
  v_item public.menu_items;
  v_oi_id uuid;
  v_qty int;
  v_unit int;
  v_mod_id uuid;
  v_mod public.modifiers;
  v_subtotal int := 0;
  v_tax int;
begin
  select * into v_existing from public.orders where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('order_id', v_existing.id, 'order_no', v_existing.order_no,
      'public_token', v_existing.public_token, 'total_cents', v_existing.total_cents, 'existing', true);
  end if;

  select * into v_settings from public.store_settings limit 1;
  if v_settings.ordering_paused then raise exception 'ordering_paused'; end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) not between 1 and 30 then
    raise exception 'invalid_lines';
  end if;

  begin
    insert into public.customers (name, phone, email)
      values (p_name, p_phone, nullif(p_email, '')) returning id into v_customer_id;
    insert into public.orders (idempotency_key, customer_id, pickup_at, asap, notes)
      values (p_idempotency_key, v_customer_id, p_pickup_at, p_asap, coalesce(p_notes, ''))
      returning * into v_order;
  exception when unique_violation then
    select * into v_existing from public.orders where idempotency_key = p_idempotency_key;
    return jsonb_build_object('order_id', v_existing.id, 'order_no', v_existing.order_no,
      'public_token', v_existing.public_token, 'total_cents', v_existing.total_cents, 'existing', true);
  end;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_qty := (v_line ->> 'qty')::int;
    if v_qty is null or v_qty not between 1 and 20 then raise exception 'invalid_qty'; end if;

    select i.* into v_item
      from public.menu_items i join public.categories c on c.id = i.category_id
      where i.id = (v_line ->> 'item_id')::uuid and i.published and c.published;
    if not found then raise exception 'item_unavailable'; end if;
    if v_item.sold_out then raise exception 'sold_out:%', v_item.name; end if;
    if v_item.beef_only and not public.beef_today() then
      raise exception 'beef_unavailable:%', v_item.name;
    end if;

    v_unit := v_item.price_cents;
    insert into public.order_items (order_id, item_id, name_snapshot, unit_price_cents, qty, notes)
      values (v_order.id, v_item.id, v_item.name, v_item.price_cents, v_qty, left(coalesce(v_line ->> 'notes', ''), 200))
      returning id into v_oi_id;

    for v_mod_id in
      select distinct (jsonb_array_elements_text(coalesce(v_line -> 'modifier_ids', '[]'::jsonb)))::uuid
    loop
      select m.* into v_mod
        from public.modifiers m
        join public.menu_item_modifier_groups ig on ig.group_id = m.group_id and ig.item_id = v_item.id
        where m.id = v_mod_id;
      if not found then raise exception 'modifier_invalid'; end if;
      if v_mod.sold_out then raise exception 'sold_out:%', v_mod.name; end if;
      v_unit := v_unit + v_mod.price_delta_cents;
      insert into public.order_item_modifiers (order_item_id, modifier_id, name_snapshot, price_delta_cents)
        values (v_oi_id, v_mod.id, v_mod.name, v_mod.price_delta_cents);
    end loop;

    perform 1
      from public.menu_item_modifier_groups ig
      join public.modifier_groups g on g.id = ig.group_id
      where ig.item_id = v_item.id
        and (
          select count(*) from public.order_item_modifiers oim
          join public.modifiers m on m.id = oim.modifier_id
          where oim.order_item_id = v_oi_id and m.group_id = g.id
        ) not between g.min_select and g.max_select;
    if found then raise exception 'modifier_selection:%', v_item.name; end if;

    update public.order_items set unit_price_cents = v_unit where id = v_oi_id;
    v_subtotal := v_subtotal + v_unit * v_qty;
  end loop;

  v_tax := round(v_subtotal * v_settings.tax_rate)::int;
  update public.orders
    set subtotal_cents = v_subtotal, tax_cents = v_tax, total_cents = v_subtotal + v_tax
    where id = v_order.id;

  return jsonb_build_object('order_id', v_order.id, 'order_no', v_order.order_no,
    'public_token', v_order.public_token, 'total_cents', v_subtotal + v_tax, 'existing', false);
end $$;

-- Server-only. The only path that marks an order paid (called from the payment webhook).
create or replace function public.mark_order_paid(
  p_order_id uuid,
  p_event_id text,
  p_event_type text,
  p_amount_cents int,
  p_session_id text
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
  v_inserted int;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return 'not_found'; end if;

  insert into public.webhook_events (event_id, type) values (p_event_id, p_event_type)
    on conflict (event_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then return 'duplicate'; end if;

  if p_amount_cents is distinct from v_order.total_cents then return 'amount_mismatch'; end if;
  if v_order.payment_status = 'paid' then return 'already_paid'; end if;

  update public.orders
    set payment_status = 'paid',
        paid_at = now(),
        stripe_session_id = coalesce(nullif(p_session_id, ''), stripe_session_id),
        status = case when status = 'pending_payment' then 'new'::public.order_status else status end
    where id = p_order_id;
  return 'paid';
end $$;

-- Server-only token bucket. Returns true while the caller is under the limit.
create or replace function public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_count int;
begin
  insert into public.rate_limits as r (key, window_start, count) values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds)
                        then now() else r.window_start end,
    count = case when r.window_start < now() - make_interval(secs => p_window_seconds)
                 then 1 else r.count + 1 end
  returning count into v_count;
  return v_count <= p_limit;
end $$;

-- Orders: stamp ready_at, and tell the customer's browser about status changes.
-- The topic is the secret order token, so only the person holding the link can listen.
create or replace function public.orders_after_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    perform realtime.send(
      jsonb_build_object('status', new.status, 'at', now()),
      'status',
      'order:' || new.public_token,
      false
    );
  end if;
  return null;
end $$;

create or replace function public.orders_before_status() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'ready' and old.status is distinct from 'ready' then new.ready_at = now(); end if;
  return new;
end $$;

create trigger orders_before_status before update of status on public.orders
  for each row execute function public.orders_before_status();
create trigger orders_after_status after update of status on public.orders
  for each row execute function public.orders_after_status();
