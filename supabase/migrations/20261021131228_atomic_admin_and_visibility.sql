-- Apply after the baseline is present/recorded. No catalog business rows are rewritten.
-- Normalize inherited Supabase defaults on existing projects as well as fresh restores.
revoke all on public.admins, public.categories, public.brands, public.spec_types, public.products,
  public.product_variants, public.product_images, public.ambassadors from public, anon, authenticated;
grant select on public.categories, public.brands, public.spec_types, public.products,
  public.product_variants, public.product_images, public.ambassadors to anon;
grant select, insert, update, delete on public.categories, public.brands, public.spec_types, public.products,
  public.product_variants, public.product_images, public.ambassadors to authenticated;
create index if not exists categories_compare_group_idx on public.categories(compare_group);
create index if not exists product_images_variant_id_idx on public.product_images(variant_id);
alter function public.set_updated_at() set search_path = '';
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- One SELECT policy per table avoids overlapping public/admin SELECT policies.
do $$
declare t text; visible text;
begin
  foreach t in array array['categories','brands','spec_types','products','product_variants','product_images','ambassadors'] loop
    execute format('drop policy if exists "admin all" on public.%I',t);
    execute format('drop policy if exists "public read" on public.%I',t);
    execute format('drop policy if exists "public read spec_types" on public.%I',t);
    execute format('drop policy if exists "public read published" on public.%I',t);
    execute format('drop policy if exists "public read variants" on public.%I',t);
    execute format('drop policy if exists "public read images" on public.%I',t);
    visible := case t
      when 'categories' then 'not is_hidden'
      when 'products' then 'is_published and exists(select 1 from public.categories c where c.id = category_id and not c.is_hidden)'
      when 'product_variants' then 'is_active and exists(select 1 from public.products p where p.id = product_id and p.is_published)'
      when 'product_images' then 'exists(select 1 from public.products p where p.id = product_id and p.is_published) and (variant_id is null or exists(select 1 from public.product_variants v where v.id = variant_id and v.product_id = product_images.product_id and v.is_active))'
      when 'ambassadors' then 'is_published'
      else 'true'
    end;
    execute format('create policy "visible or admin" on public.%I for select to anon, authenticated using ((%s) or (select public.is_admin()))',t,visible);
    execute format('create policy "admin insert" on public.%I for insert to authenticated with check ((select public.is_admin()))',t);
    execute format('create policy "admin update" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using ((select public.is_admin()))',t);
  end loop;
end $$;

-- Storage bucket remains public for product photos. Admin policies are no longer duplicated.
drop policy if exists "admin write images" on storage.objects;
drop policy if exists "admin upload photos" on storage.objects;
drop policy if exists "admin update photos" on storage.objects;
drop policy if exists "admin delete photos" on storage.objects;
create policy "admin read photos" on storage.objects for select to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admin upload photos" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admin update photos" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()))
with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "admin delete photos" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select public.is_admin())
  and not exists(select 1 from public.product_images i where i.path = storage.objects.name)
  and not exists(select 1 from public.ambassadors a where a.image_path = storage.objects.name)
  and not exists(select 1 from public.product_variants v where v.image_path = storage.objects.name));

-- Record cleanup intent in the SAME transaction as the removed/replaced reference.
-- No folder listing, no sweep of uncommitted browser uploads. Failed deletes are retryable.
create table public.storage_cleanup_queue (
  path text primary key,
  created_at timestamptz not null default now(),
  attempts integer not null default 0,
  last_error text
);
alter table public.storage_cleanup_queue enable row level security;
revoke all on public.storage_cleanup_queue from public, anon, authenticated;
grant select, insert, update, delete on public.storage_cleanup_queue to authenticated;
grant all on public.storage_cleanup_queue to service_role;
revoke all on public.storage_cleanup_queue from anon;
create policy "admin cleanup" on public.storage_cleanup_queue for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create function public.queue_removed_image() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare old_path text;
begin
  old_path := to_jsonb(old) ->> tg_argv[0];
  if old_path is not null and old_path <> '' and
    (tg_op = 'DELETE' or old_path is distinct from (to_jsonb(new) ->> tg_argv[0])) then
    insert into public.storage_cleanup_queue(path) values(old_path)
    on conflict(path) do update set created_at = now(), last_error = null;
  end if;
  return null;
end $$;
create trigger removed_product_image after delete or update of path on public.product_images
for each row execute function public.queue_removed_image('path');
create trigger removed_ambassador_image after delete or update of image_path on public.ambassadors
for each row execute function public.queue_removed_image('image_path');
create trigger removed_variant_image after delete or update of image_path on public.product_variants
for each row execute function public.queue_removed_image('image_path');

-- SECURITY INVOKER keeps RLS in force. Any error rolls back product, variants,
-- cascaded image records, and cleanup queue together.
create function public.admin_save_product(p_id uuid, p_product jsonb, p_variants jsonb, p_is_new boolean)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v jsonb; keep_ids uuid[]; saved_id uuid;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if jsonb_typeof(p_variants) is distinct from 'array' or jsonb_typeof(p_product) is distinct from 'object'
    or coalesce(btrim(p_product->>'name_az'),'') = '' or p_product->>'category_id' is null then
    raise exception 'Invalid product data' using errcode = '22023';
  end if;
  select coalesce(array_agg((x->>'id')::uuid),array[]::uuid[]) into keep_ids from jsonb_array_elements(p_variants) x;
  if array_position(keep_ids,null) is not null or cardinality(keep_ids) <> (select count(distinct x) from unnest(keep_ids) x) then
    raise exception 'Duplicate or missing variant id' using errcode = '22023';
  end if;
  if exists(select 1 from public.product_variants where id = any(keep_ids) and product_id <> p_id) then
    raise exception 'Variant belongs to another product' using errcode = '22023';
  end if;
  if p_is_new then
    if coalesce(p_product->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
      raise exception 'Invalid slug' using errcode = '22023';
    end if;
    insert into public.products(id,slug,name_az,category_id) values(p_id,p_product->>'slug',p_product->>'name_az',(p_product->>'category_id')::uuid);
  else
    perform 1 from public.products where id = p_id for update;
    if not found then raise exception 'Product not found' using errcode = 'P0002'; end if;
  end if;
  update public.products set
    category_id=(p_product->>'category_id')::uuid, brand_id=(p_product->>'brand_id')::uuid,
    name_az=p_product->>'name_az', name_ru=p_product->>'name_ru', name_en=p_product->>'name_en',
    description_az=p_product->>'description_az', description_ru=p_product->>'description_ru', description_en=p_product->>'description_en',
    is_published=(p_product->>'is_published')::boolean, is_new=(p_product->>'is_new')::boolean,
    is_featured=(p_product->>'is_featured')::boolean, specs=coalesce(p_product->'specs','{}'::jsonb)
  where id=p_id returning id into saved_id;

  delete from public.product_variants where product_id=p_id and not(id=any(keep_ids));
  for v in select value from jsonb_array_elements(p_variants) loop
    if coalesce(btrim(v->>'sku'),'')='' or (v->>'price')::numeric < 0 or (v->>'price')::numeric = 'NaN'::numeric then
      raise exception 'Invalid variant' using errcode='22023';
    end if;
    insert into public.product_variants(id,product_id,sku,name_az,name_ru,name_en,price,stock,is_active,sort_order)
    values((v->>'id')::uuid,p_id,btrim(v->>'sku'),v->>'name_az',v->>'name_ru',v->>'name_en',
      (v->>'price')::numeric,(v->>'stock')::integer,(v->>'is_active')::boolean,(v->>'sort_order')::integer)
    on conflict(id) do update set sku=excluded.sku,name_az=excluded.name_az,name_ru=excluded.name_ru,name_en=excluded.name_en,
      price=excluded.price,stock=excluded.stock,is_active=excluded.is_active,sort_order=excluded.sort_order
    where product_variants.product_id=p_id;
  end loop;
  if not exists(select 1 from public.product_images where product_id=p_id and is_main) then
    update public.product_images set is_main=true where id=(select id from public.product_images where product_id=p_id order by sort_order,id limit 1);
  end if;
  return saved_id;
end $$;

create function public.admin_save_ambassadors(p_rows jsonb, p_removed_ids uuid[])
returns void language plpgsql security invoker set search_path = '' as $$
declare r jsonb; n integer := 0;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'Invalid rows' using errcode='22023'; end if;
  delete from public.ambassadors where id=any(p_removed_ids);
  for r in select value from jsonb_array_elements(p_rows) loop
    if coalesce(btrim(r->>'name'),'')='' or (r->>'image_path' is not null and r->>'image_path' not like 'ambassadors/%') then
      raise exception 'Invalid ambassador' using errcode='22023';
    end if;
    if r->>'id' is null then
      insert into public.ambassadors(name,role_az,role_ru,role_en,instagram,image_path,is_published,sort_order)
      values(r->>'name',r->>'role_az',r->>'role_ru',r->>'role_en',r->>'instagram',r->>'image_path',(r->>'is_published')::boolean,n);
    else
      update public.ambassadors set name=r->>'name',role_az=r->>'role_az',role_ru=r->>'role_ru',role_en=r->>'role_en',
        instagram=r->>'instagram',image_path=r->>'image_path',is_published=(r->>'is_published')::boolean,sort_order=n
      where id=(r->>'id')::uuid;
      if not found then raise exception 'Ambassador not found' using errcode='P0002'; end if;
    end if;
    n := n+1;
  end loop;
end $$;

create function public.admin_add_images(p_product_id uuid, p_items jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare product_slug text; item jsonb; next_order integer; needs_main boolean;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  select slug into product_slug from public.products where id=p_product_id for update;
  if not found then raise exception 'Product not found' using errcode='P0002'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' then raise exception 'Invalid images' using errcode='22023'; end if;
  select coalesce(max(sort_order),-1)+1, not coalesce(bool_or(is_main),false) into next_order,needs_main
    from public.product_images where product_id=p_product_id;
  for item in select value from jsonb_array_elements(p_items) loop
    if item->>'path' is null or left(item->>'path',length(product_slug)+1) <> product_slug || '/'
      or (item->>'variantId' is not null and not exists(select 1 from public.product_variants where id=(item->>'variantId')::uuid and product_id=p_product_id)) then
      raise exception 'Invalid image or variant' using errcode='22023';
    end if;
    insert into public.product_images(product_id,variant_id,path,sort_order,is_main)
    values(p_product_id,(item->>'variantId')::uuid,item->>'path',next_order,needs_main);
    next_order:=next_order+1; needs_main:=false;
  end loop;
end $$;

create function public.admin_set_main_image(p_product_id uuid, p_image_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  perform 1 from public.products where id=p_product_id for update;
  if not exists(select 1 from public.product_images where id=p_image_id and product_id=p_product_id) then
    raise exception 'Image not found' using errcode='P0002';
  end if;
  update public.product_images set is_main=false where product_id=p_product_id and is_main;
  update public.product_images set is_main=true where id=p_image_id;
end $$;

create function public.admin_reorder_images(p_ids uuid[])
returns void language plpgsql security invoker set search_path = '' as $$
declare product uuid; found_count integer; product_count integer;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if coalesce(cardinality(p_ids),0)=0 then return; end if;
  select count(*),count(distinct product_id) into found_count,product_count from public.product_images where id=any(p_ids);
  if found_count<>cardinality(p_ids) or product_count<>1 then raise exception 'Invalid image order' using errcode='22023'; end if;
  select product_id into product from public.product_images where id=p_ids[1];
  perform 1 from public.products where id=product for update;
  update public.product_images i set sort_order=n.ordinality-1 from unnest(p_ids) with ordinality n(id,ordinality) where i.id=n.id;
end $$;

create function public.admin_delete_image(p_image_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare product uuid;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  select product_id into product from public.product_images where id=p_image_id;
  if not found then raise exception 'Image not found' using errcode='P0002'; end if;
  perform 1 from public.products where id=product for update;
  delete from public.product_images where id=p_image_id;
  if not exists(select 1 from public.product_images where product_id=product and is_main) then
    update public.product_images set is_main=true where id=(select id from public.product_images where product_id=product order by sort_order,id limit 1);
  end if;
end $$;

revoke all on function public.queue_removed_image() from public, anon, authenticated;
revoke all on function public.admin_save_product(uuid,jsonb,jsonb,boolean) from public, anon, authenticated;
revoke all on function public.admin_save_ambassadors(jsonb,uuid[]) from public, anon, authenticated;
revoke all on function public.admin_add_images(uuid,jsonb) from public, anon, authenticated;
revoke all on function public.admin_set_main_image(uuid,uuid) from public, anon, authenticated;
revoke all on function public.admin_reorder_images(uuid[]) from public, anon, authenticated;
revoke all on function public.admin_delete_image(uuid) from public, anon, authenticated;
grant execute on function public.admin_save_product(uuid,jsonb,jsonb,boolean), public.admin_save_ambassadors(jsonb,uuid[]),
  public.admin_add_images(uuid,jsonb), public.admin_set_main_image(uuid,uuid),
  public.admin_reorder_images(uuid[]), public.admin_delete_image(uuid) to authenticated;

-- Whole-list editors must not commit deletions before later rows have been validated.
create function public.admin_save_categories(p_rows jsonb, p_removed_ids uuid[])
returns void language plpgsql security invoker set search_path = '' as $$
declare r jsonb; n integer := 0; target jsonb;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'Invalid categories' using errcode='22023'; end if;
  lock table public.categories in share row exclusive mode;
  if (select count(*) <> count(distinct value->>'slug') from jsonb_array_elements(p_rows)) then
    raise exception 'Duplicate category slug' using errcode='22023';
  end if;
  delete from public.products where category_id=any(p_removed_ids);
  delete from public.categories where id=any(p_removed_ids);
  for r in select value from jsonb_array_elements(p_rows) loop
    if coalesce(r->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or coalesce(btrim(r->>'name_az'),'')='' then
      raise exception 'Invalid category' using errcode='22023';
    end if;
    if r->>'id' is not null and not exists(select 1 from public.categories where id=(r->>'id')::uuid and slug=r->>'slug') then
      raise exception 'Category not found or slug changed' using errcode='P0002';
    end if;
    if r->>'id' is null and exists(select 1 from public.categories where slug=r->>'slug') then
      raise exception 'Category slug already exists' using errcode='23505';
    end if;
    insert into public.categories(slug,name_az,name_ru,name_en,is_hidden,sort_order)
    values(r->>'slug',r->>'name_az',r->>'name_ru',r->>'name_en',(r->>'is_hidden')::boolean,n)
    on conflict(slug) do update set name_az=excluded.name_az,name_ru=excluded.name_ru,name_en=excluded.name_en,is_hidden=excluded.is_hidden,sort_order=excluded.sort_order;
    n:=n+1;
  end loop;
  for r in select value from jsonb_array_elements(p_rows) loop
    if r->>'compare_group' is not null then
      select value into target from jsonb_array_elements(p_rows) where value->>'slug'=r->>'compare_group';
      if not found or target->>'compare_group' is not null or r->>'compare_group'=r->>'slug' then
        raise exception 'Invalid comparison group' using errcode='22023';
      end if;
    end if;
    update public.categories set compare_group=r->>'compare_group' where slug=r->>'slug';
  end loop;
end $$;

create function public.admin_save_spec_types(p_rows jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare r jsonb; n integer := 0;
begin
  if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'Invalid specifications' using errcode='22023'; end if;
  lock table public.spec_types in share row exclusive mode;
  if (select count(*) <> count(distinct value->>'key') from jsonb_array_elements(p_rows)) then
    raise exception 'Duplicate specification key' using errcode='22023';
  end if;
  delete from public.spec_types s where not exists(select 1 from jsonb_array_elements(p_rows) entry where entry->>'key'=s.key);
  for r in select value from jsonb_array_elements(p_rows) loop
    if coalesce(r->>'key','') !~ '^[a-z0-9_]+$' or coalesce(btrim(r->>'label_az'),'')='' then
      raise exception 'Invalid specification' using errcode='22023';
    end if;
    insert into public.spec_types(key,label_az,label_ru,label_en,sort_order)
    values(r->>'key',r->>'label_az',r->>'label_ru',r->>'label_en',n)
    on conflict(key) do update set label_az=excluded.label_az,label_ru=excluded.label_ru,label_en=excluded.label_en,sort_order=excluded.sort_order;
    n:=n+1;
  end loop;
end $$;
revoke all on function public.admin_save_categories(jsonb,uuid[]),public.admin_save_spec_types(jsonb) from public, anon, authenticated;
grant execute on function public.admin_save_categories(jsonb,uuid[]),public.admin_save_spec_types(jsonb) to authenticated;


