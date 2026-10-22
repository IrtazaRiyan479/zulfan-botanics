-- Create a profile row at Auth signup so email-confirmation users are covered before they have a client session.
create or replace function public.create_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id, full_name, phone, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.raw_user_meta_data ->> 'phone', ''), coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.create_customer_profile() from public, anon, authenticated, service_role;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.create_customer_profile();
