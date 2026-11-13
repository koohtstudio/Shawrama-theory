-- Seed data for MOCK mode. Never run against a live database.
-- Anything marked placeholder is a stand-in until the real menu, prices and reviews arrive (see TODO-LIVE.md).

insert into public.store_settings
  (id, prep_minutes, ordering_paused, beef_mode, tax_rate, rating, review_count,
   phone, address, maps_url, doordash_url, ubereats_url, instagram_url)
values
  (true, 15, false, 'auto', 0.13, 4.9, 777,
   '(705) 721-7774', '510 Bayfield St, Barrie, ON',
   'https://www.google.com/maps/dir/?api=1&destination=510+Bayfield+St+Barrie+ON',
   'https://www.doordash.com/store/shawarma-theory-barrie-35137629/',
   'https://www.ubereats.com/',
   'https://www.instagram.com/theory_shawarma/');

insert into public.beef_schedule (dow) values (0), (5);  -- Sunday, Friday

-- Placeholder hours: 11 to 9 daily, Friday to 10.
insert into public.hours (dow, is_closed, opens, closes) values
  (0, false, '11:00', '21:00'), (1, false, '11:00', '21:00'), (2, false, '11:00', '21:00'),
  (3, false, '11:00', '21:00'), (4, false, '11:00', '21:00'), (5, false, '11:00', '22:00'),
  (6, false, '11:00', '21:00');
insert into public.closures (on_date, label) values ('2026-12-25', 'Christmas Day');

insert into public.categories (slug, name, sort, published) values
  ('wraps', 'Saj wraps', 1, true),
  ('bowls', 'Bowls', 2, true),
  ('platters', 'Platters', 3, true),
  ('sides', 'Sides and salads', 4, true),
  ('drinks', 'Drinks', 5, false);

-- price_is_placeholder = true means the number is a demo value only.
insert into public.menu_items
  (category_id, slug, name, description, price_cents, price_is_placeholder, image_src, image_alt, tags, beef_only, featured, sort)
select c.id, v.slug, v.name, v.description, v.price_cents, v.ph, v.image_src, v.image_alt, v.tags, v.beef_only, v.featured, v.sort
from (values
  ('wraps', 'chicken-shawarma-saj-wrap', 'Chicken Shawarma Saj Wrap', 'Our signature. 24 hour chicken, fresh saj, pickles, garlic and everything else.', 1499, true, '/photos/theory-saj-wrap.jpg', 'Chicken shawarma saj wrap', '{}'::text[], false, true, 1),
  ('wraps', 'falafel-saj-wrap', 'Falafel Saj Wrap', 'House falafel, golden eggplant, tahini and crunchy greens on saj.', 1499, false, '/photos/falafel-wrap-eggplant.jpg', 'Falafel saj wrap with eggplant', '{Vegan}', false, true, 2),
  ('wraps', 'beef-lamb-saj-wrap', 'Beef and Lamb Saj Wrap', 'Fridays and Sundays only, carved straight off the spit.', 1699, true, '/photos/beef-steaks-shawarma.jpg', 'Beef shawarma carved from the spit', '{"Fri and Sun"}', true, true, 3),
  ('bowls', 'chicken-shawarma-bowl', 'Chicken Shawarma Bowl', 'Rice and salad, loaded with chicken and your choice of sauces.', 1499, false, '/photos/wraps-on-paper.jpg', 'Chicken shawarma bowl', '{}', false, true, 1),
  ('bowls', 'falafel-bowl', 'Falafel Bowl', 'Rice and salad with fresh falafel and the full spread of toppings.', 1499, false, '/photos/falafel-fresh.jpg', 'Fresh falafel', '{Vegan,GF}', false, false, 2),
  ('bowls', 'over-hummus', 'Over Hummus', 'Hummus topped with your pick: crispy cauliflower, falafel or shawarma.', 1399, true, '/photos/over-hummus-bowls.jpg', 'Hummus bowls topped with cauliflower and shawarma', '{}', false, true, 3),
  ('platters', 'platter-for-two', 'Platter for Two', 'Chicken shawarma, rice, salads, dips and saj to share.', 3499, true, '/photos/spread-table.jpg', 'A full spread of wraps, dips and salads', '{}', false, false, 1),
  ('platters', 'family-platter', 'Family Platter', 'The big one. Enough for everyone, with all the sauces.', 6499, true, null, '', '{}', false, false, 2),
  ('sides', 'falafel-4', 'Falafel, 4 pieces', 'Crispy outside, bright green inside. Chickpeas, veg and fresh herbs.', 549, false, '/photos/falafel-fresh.jpg', 'Falafel', '{Vegan,GF}', false, false, 1),
  ('sides', 'tabouli', 'Tabouli', 'Quinoa, parsley, tomato and cucumber with olive oil and lemon.', 599, false, '/photos/tabouli-salad.jpg', 'Quinoa tabouli salad', '{GF}', false, false, 2),
  ('sides', 'hummus-or-baba', 'Hummus or Baba Ghanoush', 'Silky, garlicky and made fresh every day.', 599, false, null, '', '{Vegan}', false, false, 3),
  ('sides', 'chickpea-salad', 'Chickpea Salad', 'Bright, herby and a little tangy.', 599, false, null, '', '{Vegan}', false, false, 4),
  ('sides', 'red-pepper-walnut', 'Red Pepper Walnut Spread', 'Roasted red pepper and walnut, rich and smoky.', 599, true, '/photos/red-pepper-walnut.jpg', 'Red pepper walnut spread', '{}', false, false, 5)
) as v(cat, slug, name, description, price_cents, ph, image_src, image_alt, tags, beef_only, featured, sort)
join public.categories c on c.slug = v.cat;

-- Add-ons (all prices are placeholders).
insert into public.modifier_groups (id, name, min_select, max_select, sort) values
  ('00000000-0000-4000-8000-000000000001', 'Add-ons', 0, 6, 1),
  ('00000000-0000-4000-8000-000000000002', 'Pick your topping', 1, 1, 0);

insert into public.modifiers (group_id, name, price_delta_cents, price_is_placeholder, sort) values
  ('00000000-0000-4000-8000-000000000001', 'Extra garlic', 50, true, 1),
  ('00000000-0000-4000-8000-000000000001', 'Make it spicy', 0, true, 2),
  ('00000000-0000-4000-8000-000000000001', 'Extra amba', 50, true, 3),
  ('00000000-0000-4000-8000-000000000001', 'Extra house hot sauce', 50, true, 4),
  ('00000000-0000-4000-8000-000000000001', 'Extra pickles', 0, true, 5),
  ('00000000-0000-4000-8000-000000000002', 'Crispy cauliflower', 0, true, 1),
  ('00000000-0000-4000-8000-000000000002', 'Falafel', 0, true, 2),
  ('00000000-0000-4000-8000-000000000002', 'Chicken shawarma', 200, true, 3);

insert into public.menu_item_modifier_groups (item_id, group_id)
select i.id, '00000000-0000-4000-8000-000000000001'::uuid from public.menu_items i
where i.slug in ('chicken-shawarma-saj-wrap', 'falafel-saj-wrap', 'beef-lamb-saj-wrap',
                 'chicken-shawarma-bowl', 'falafel-bowl', 'over-hummus');
insert into public.menu_item_modifier_groups (item_id, group_id)
select i.id, '00000000-0000-4000-8000-000000000002'::uuid from public.menu_items i where i.slug = 'over-hummus';

-- Unverified review quotes carried over from the design concept. Replace with confirmed ones.
insert into public.reviews (quote, author, source, verified, sort) values
  ('Epic sized portions, fresh tasting meat, homemade sauces, real good stuff', 'Google reviewer', 'Google', false, 1),
  ('They make the bread and all sauces in house. They load it up. Falafel is absolute fire.', 'Ben S.', 'Google', false, 2),
  ('Consistently the best shawarma in Barrie, and probably the best shawarma for a few hours in any direction.', 'Robert K.', 'DoorDash', false, 3),
  ('The portions are generous, the chicken is juicy and well-seasoned and the produce is fresh.', 'Kathleen T.', 'DoorDash', false, 4);

insert into public.message_templates (key, channel, subject, body, enabled) values
  ('order_confirmation', 'email', 'Order #{{order_no}} is in, {{first_name}}',
   E'Thanks {{first_name}}! Your order #{{order_no}} is in and the kitchen is on it.\n\nPickup: {{pickup_time}}\nTotal: {{total}}\n\n{{items}}\n\nWatch it live: {{status_url}}\n\nShawarma Theory, 510 Bayfield St, Barrie', true),
  ('order_ready', 'email', 'Order #{{order_no}} is ready for pickup',
   E'{{first_name}}, your order #{{order_no}} is ready. Come grab it while it''s hot.\n\nShawarma Theory, 510 Bayfield St, Barrie', true),
  ('order_ready', 'sms', '',
   'Shawarma Theory: {{first_name}}, order #{{order_no}} is ready for pickup!', false);

-- Demo staff account for the "Demo login" button (mock mode only).
-- email: demo@shawarmatheory.test   password: shawarma-demo-1
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
) values (
  '00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111',
  'authenticated', 'authenticated', 'demo@shawarmatheory.test',
  extensions.crypt('shawarma-demo-1', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', '', '', '', '', ''
);
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'email',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"demo@shawarmatheory.test","email_verified":true}', now(), now(), now());
insert into public.profiles (user_id, role, display_name)
values ('11111111-1111-4111-8111-111111111111', 'owner', 'Demo owner');
