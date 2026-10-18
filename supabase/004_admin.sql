-- Run ONCE in Supabase -> SQL Editor (paste, press Run; no begin/commit).
-- Admin access: is_admin() says whether the logged-in user is listed in table admins.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;
-- anon must be allowed to call it too (policies below are checked for every visitor, the answer is just false)
grant execute on function public.is_admin() to anon, authenticated;

-- nobody reads the admins list through the public API (is_admin() above still works)
alter table admins enable row level security;

-- admins can read AND change everything the admin panel needs (visitors still only see published products, as before)
do $$
declare t text;
begin
  foreach t in array array['products', 'product_variants', 'product_images', 'categories', 'brands', 'spec_types'] loop
    execute format('drop policy if exists "admin all" on %I', t);
    execute format('create policy "admin all" on %I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- check: shows the emails that have admin access (must contain yours)
select u.email from admins a join auth.users u on u.id = a.user_id;
