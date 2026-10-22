-- Zulfan Botanics: visitor-owned saved cart and wishlist state.
-- No service-role key is used by the browser.
create table if not exists public.store_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cart jsonb not null default '[]'::jsonb,
  wishlist jsonb not null default '[]'::jsonb,
  coupon_code text,
  updated_at timestamptz not null default now(),
  constraint store_state_cart_array check (jsonb_typeof(cart) = 'array'),
  constraint store_state_wishlist_array check (jsonb_typeof(wishlist) = 'array'),
  constraint store_state_coupon_code check (coupon_code is null or coupon_code = 'ZULFAN10')
);

alter table public.store_state enable row level security;
alter table public.store_state force row level security;

create policy "Visitors can read their own store state"
  on public.store_state for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Visitors can create their own store state"
  on public.store_state for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Visitors can update their own store state"
  on public.store_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.store_state to authenticated;
revoke all on public.store_state from anon;
