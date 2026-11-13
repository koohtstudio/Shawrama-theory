-- Tables that stream changes to browsers. Realtime applies each subscriber's RLS to every change.
alter publication supabase_realtime add table
  public.store_settings, public.beef_schedule, public.hours, public.closures,
  public.menu_items, public.modifiers, public.orders;

alter table public.store_settings replica identity full;
alter table public.menu_items replica identity full;
alter table public.modifiers replica identity full;
alter table public.orders replica identity full;
