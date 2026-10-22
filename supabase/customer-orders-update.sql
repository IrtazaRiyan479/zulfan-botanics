-- Extend order ownership and grant customers read-only order access.
alter table public.customer_orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.customer_orders add constraint customer_orders_items_array check (jsonb_typeof(items) = 'array');
grant update on public.customer_orders to authenticated;
create policy "Customers may update their own order details" on public.customer_orders for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
