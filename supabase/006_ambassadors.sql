-- Run ONCE in Supabase -> SQL Editor (paste, press Run; no begin/commit).
-- Ambassadors shown on the home page. Photo files live in bucket product-images, folder ambassadors/.
create table if not exists ambassadors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_az text, role_ru text, role_en text,
  instagram text,
  image_path text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table ambassadors enable row level security;

-- visitors see only published ambassadors, admins can do everything
drop policy if exists "public read" on ambassadors;
create policy "public read" on ambassadors for select using (is_published);
drop policy if exists "admin all" on ambassadors;
create policy "admin all" on ambassadors for all using (public.is_admin()) with check (public.is_admin());

-- check: must show 2 rows
select policyname from pg_policies where tablename = 'ambassadors';
