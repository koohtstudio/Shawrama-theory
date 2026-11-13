begin;
select no_plan();

-- ── fixtures (as postgres) ──
insert into public.categories (slug, name, published) values ('t-hidden-cat', 'Hidden cat', false);
insert into public.menu_items (category_id, slug, name, price_cents, published)
  select id, 't-hidden-item', 'Hidden item', 100, false from public.categories where slug = 'wraps';
insert into public.menu_items (category_id, slug, name, price_cents)
  select id, 't-in-hidden-cat', 'Item in hidden cat', 100 from public.categories where slug = 't-hidden-cat';

insert into auth.users (id, aud, role, email, instance_id)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'rando@test.dev', '00000000-0000-0000-0000-000000000000'),
         ('aaaaaaaa-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'staff@test.dev', '00000000-0000-0000-0000-000000000000');
insert into public.profiles (user_id, role) values ('aaaaaaaa-0000-4000-8000-000000000002', 'staff');

-- A real order made through the server function.
select public.create_order('test-key-1', 'Test Person', '7055550123', 'a@b.dev', now() + interval '30 minutes', true, '',
  jsonb_build_array(jsonb_build_object('item_id', (select id from public.menu_items where slug = 'chicken-shawarma-saj-wrap'), 'qty', 1,
    'modifier_ids', jsonb_build_array((select id from public.modifiers where name = 'Extra garlic')))));

-- ── anonymous visitor ──
set local role anon;
select throws_ok('select * from public.orders', '42501', null, 'anon cannot read orders');
select throws_ok('select * from public.customers', '42501', null, 'anon cannot read customers');
select throws_ok('select * from public.order_items', '42501', null, 'anon cannot read order_items');
select throws_ok('select * from public.order_item_modifiers', '42501', null, 'anon cannot read order_item_modifiers');
select throws_ok('select * from public.notifications_log', '42501', null, 'anon cannot read notifications_log');
select throws_ok('select * from public.message_templates', '42501', null, 'anon cannot read message_templates');
select throws_ok('select * from public.profiles', '42501', null, 'anon cannot read profiles');
select throws_ok('select * from public.webhook_events', '42501', null, 'anon cannot read webhook_events');
select throws_ok('select * from public.rate_limits', '42501', null, 'anon cannot read rate_limits');
select throws_ok($$update public.menu_items set price_cents = 1$$, '42501', null, 'anon cannot change prices');
select throws_ok($$update public.modifiers set price_delta_cents = 0$$, '42501', null, 'anon cannot change add-on prices');
select throws_ok($$delete from public.menu_items$$, '42501', null, 'anon cannot delete menu items');
select throws_ok($$insert into public.menu_items (category_id, slug, name, price_cents) select id, 'x', 'x', 1 from public.categories limit 1$$, '42501', null, 'anon cannot add menu items');
select throws_ok($$update public.store_settings set ordering_paused = true$$, '42501', null, 'anon cannot pause ordering');
select throws_ok($$insert into public.orders (idempotency_key, customer_id, pickup_at) values ('x', gen_random_uuid(), now())$$, '42501', null, 'anon cannot insert orders');
select throws_ok($$select public.create_order('k', 'n', 'p', '', now(), true, '', '[]'::jsonb)$$, '42501', null, 'anon cannot call create_order');
select throws_ok($$select public.mark_order_paid(gen_random_uuid(), 'e', 't', 1, null)$$, '42501', null, 'anon cannot call mark_order_paid');
select throws_ok($$select public.rate_limit_hit('k', 1, 1)$$, '42501', null, 'anon cannot call rate_limit_hit');
select is((select count(*)::int from public.menu_items where slug = 't-hidden-item'), 0, 'anon cannot see unpublished items');
select is((select count(*)::int from public.menu_items where slug = 't-in-hidden-cat'), 0, 'anon cannot see items in unpublished categories');
select is((select count(*)::int from public.categories where slug = 't-hidden-cat'), 0, 'anon cannot see unpublished categories');
select ok((select count(*) from public.menu_items) > 0, 'anon can read published menu items');
select ok((select count(*) from public.store_settings) = 1, 'anon can read store settings');
select ok((select count(*) from public.hours) = 7, 'anon can read hours');
reset role;

-- ── signed-in but not staff ──
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}';
select is((select count(*)::int from public.orders), 0, 'non-staff sees no orders');
select is((select count(*)::int from public.customers), 0, 'non-staff sees no customers');
select is((select count(*)::int from public.message_templates), 0, 'non-staff sees no templates');
select is((select count(*)::int from public.notifications_log), 0, 'non-staff sees no notification log');
select throws_ok($$insert into public.menu_items (category_id, slug, name, price_cents) select id, 'y', 'y', 1 from public.categories limit 1$$, '42501', null, 'non-staff cannot add menu items');
select throws_ok($$insert into public.profiles (user_id, role) values ('aaaaaaaa-0000-4000-8000-000000000001', 'owner')$$, '42501', null, 'non-staff cannot make themselves owner');
with u as (update public.menu_items set price_cents = 1 returning 1) select is((select count(*)::int from u), 0, 'non-staff price update touches zero rows');
with u as (update public.orders set status = 'ready' returning 1) select is((select count(*)::int from u), 0, 'non-staff cannot move orders');
reset role;
select ok((select min(price_cents) from public.menu_items where slug = 'falafel-saj-wrap') > 1, 'prices are unchanged after attacks');

-- ── staff ──
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-000000000002","role":"authenticated"}';
select is((select count(*)::int from public.orders), 1, 'staff can read orders');
select is((select count(*)::int from public.customers), 1, 'staff can read customers');
select lives_ok($$update public.menu_items set sold_out = true where slug = 'tabouli'$$, 'staff can flip sold out');
select lives_ok($$update public.store_settings set prep_minutes = 25$$, 'staff can change prep time');
select throws_ok($$update public.orders set total_cents = 1$$, '42501', null, 'staff cannot rewrite order totals');
select throws_ok($$insert into public.profiles (user_id, role) values ('aaaaaaaa-0000-4000-8000-000000000001', 'owner')$$, '42501', null, 'staff cannot create owners');
select throws_ok('select * from public.webhook_events', '42501', null, 'staff cannot read webhook_events');
select lives_ok($$update public.orders set status = 'preparing'$$, 'staff can move orders');
reset role;

-- status change fires the customer broadcast
select ok((select count(*) from realtime.messages where topic like 'order:%') >= 1, 'status change broadcasts to the order topic');

-- ── create_order: server-side pricing ──
select is((select subtotal_cents from public.orders where idempotency_key = 'test-key-1'), 1549, 'subtotal = item price + add-on, from the database');
select is((select total_cents from public.orders where idempotency_key = 'test-key-1'), 1750, 'total includes 13% tax');
select is((public.create_order('test-key-1', 'Dup', '1', '', now(), true, '', '[]'::jsonb) ->> 'existing')::boolean, true, 'same idempotency key returns the same order');
select throws_ok($$select public.create_order('k2', 'n', 'p', '', now(), true, '', jsonb_build_array(jsonb_build_object('item_id', (select id from public.menu_items where slug = 't-hidden-item'), 'qty', 1)))$$, 'P0001', 'item_unavailable', 'unpublished items cannot be ordered');
select throws_ok($$select public.create_order('k3', 'n', 'p', '', now(), true, '', jsonb_build_array(jsonb_build_object('item_id', (select id from public.menu_items where slug = 'tabouli'), 'qty', 1)))$$, 'P0001', 'sold_out:Tabouli', 'sold-out items cannot be ordered');
select throws_ok($$select public.create_order('k4', 'n', 'p', '', now(), true, '', jsonb_build_array(jsonb_build_object('item_id', (select id from public.menu_items where slug = 'falafel-saj-wrap'), 'qty', 99)))$$, 'P0001', 'invalid_qty', 'quantity is capped');
select throws_ok($$select public.create_order('k5', 'n', 'p', '', now(), true, '', jsonb_build_array(jsonb_build_object('item_id', (select id from public.menu_items where slug = 'over-hummus'), 'qty', 1)))$$, 'P0001', 'modifier_selection:Over Hummus', 'required add-on group is enforced');
update public.store_settings set beef_mode = 'off';
select throws_ok($$select public.create_order('k6', 'n', 'p', '', now(), true, '', jsonb_build_array(jsonb_build_object('item_id', (select id from public.menu_items where slug = 'beef-lamb-saj-wrap'), 'qty', 1)))$$, 'P0001', 'beef_unavailable:Beef and Lamb Saj Wrap', 'beef items are blocked on non-beef days');
update public.store_settings set beef_mode = 'on';
select lives_ok($$select public.create_order('k7', 'n', 'p', '', now(), true, '', jsonb_build_array(jsonb_build_object('item_id', (select id from public.menu_items where slug = 'beef-lamb-saj-wrap'), 'qty', 1)))$$, 'beef items order fine on beef days');
update public.store_settings set ordering_paused = true;
select throws_ok($$select public.create_order('k8', 'n', 'p', '', now(), true, '', jsonb_build_array(jsonb_build_object('item_id', (select id from public.menu_items where slug = 'falafel-saj-wrap'), 'qty', 1)))$$, 'P0001', 'ordering_paused', 'paused store refuses orders');
update public.store_settings set ordering_paused = false;

-- ── mark_order_paid ──
select is((select status::text from public.orders where idempotency_key = 'test-key-1'), 'preparing', 'precondition');
select is(public.mark_order_paid((select id from public.orders where idempotency_key = 'k7'), 'evt_1', 'test', 1, 's'), 'amount_mismatch', 'wrong amount is not accepted');
select is(public.mark_order_paid((select id from public.orders where idempotency_key = 'k7'), 'evt_2', 'test', (select total_cents from public.orders where idempotency_key = 'k7'), 's'), 'paid', 'correct amount marks paid');
select is((select status::text from public.orders where idempotency_key = 'k7'), 'new', 'paid order moves to new');
select is(public.mark_order_paid((select id from public.orders where idempotency_key = 'k7'), 'evt_2', 'test', 1, 's'), 'duplicate', 'replayed webhook is ignored');
select is(public.rate_limit_hit('rl-test', 2, 60), true, 'rate limit: 1st ok');
select is(public.rate_limit_hit('rl-test', 2, 60), true, 'rate limit: 2nd ok');
select is(public.rate_limit_hit('rl-test', 2, 60), false, 'rate limit: 3rd blocked');

select * from finish();
rollback;
