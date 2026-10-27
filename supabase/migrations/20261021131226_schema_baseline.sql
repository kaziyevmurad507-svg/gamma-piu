-- Sanitized schema baseline captured 2026-10-21. No business rows, credentials or auth users.
-- Fresh databases only. Existing production: compare schema, then mark baseline applied; do not replay it.

create table public."admins" (
  "user_id" uuid not null
);
alter table public."admins" enable row level security;

create table public."ambassadors" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "role_az" text,
  "role_ru" text,
  "role_en" text,
  "instagram" text,
  "image_path" text,
  "sort_order" integer default 0 not null,
  "is_published" boolean default true not null,
  "created_at" timestamp with time zone default now() not null
);
alter table public."ambassadors" enable row level security;

create table public."brands" (
  "id" uuid default gen_random_uuid() not null,
  "slug" text not null,
  "name" text not null
);
alter table public."brands" enable row level security;

create table public."categories" (
  "id" uuid default gen_random_uuid() not null,
  "parent_id" uuid,
  "slug" text not null,
  "name_az" text not null,
  "name_ru" text,
  "name_en" text,
  "sort_order" integer default 0 not null,
  "is_hidden" boolean default false not null,
  "compare_group" text
);
alter table public."categories" enable row level security;

create table public."product_images" (
  "id" uuid default gen_random_uuid() not null,
  "product_id" uuid not null,
  "path" text not null,
  "sort_order" integer default 0 not null,
  "is_main" boolean default false not null,
  "variant_id" uuid
);
alter table public."product_images" enable row level security;

create table public."product_variants" (
  "id" uuid default gen_random_uuid() not null,
  "product_id" uuid not null,
  "sku" text not null,
  "name_az" text,
  "name_ru" text,
  "name_en" text,
  "price" numeric(10,2) not null,
  "stock" integer default 0 not null,
  "is_active" boolean default true not null,
  "image_path" text,
  "sort_order" integer default 0 not null
);
alter table public."product_variants" enable row level security;

create table public."products" (
  "id" uuid default gen_random_uuid() not null,
  "category_id" uuid,
  "brand_id" uuid,
  "slug" text not null,
  "name_az" text not null,
  "name_ru" text,
  "name_en" text,
  "description_az" text,
  "description_ru" text,
  "description_en" text,
  "specs" jsonb default '{}'::jsonb not null,
  "is_published" boolean default false not null,
  "is_new" boolean default false not null,
  "is_featured" boolean default false not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
alter table public."products" enable row level security;

create table public."spec_types" (
  "id" uuid default gen_random_uuid() not null,
  "key" text not null,
  "label_az" text not null,
  "label_ru" text,
  "label_en" text,
  "sort_order" integer default 0 not null
);
alter table public."spec_types" enable row level security;

alter table public."product_images" add constraint "product_images_pkey" PRIMARY KEY (id);
alter table public."brands" add constraint "brands_pkey" PRIMARY KEY (id);
alter table public."brands" add constraint "brands_slug_key" UNIQUE (slug);
alter table public."products" add constraint "products_pkey" PRIMARY KEY (id);
alter table public."products" add constraint "products_slug_key" UNIQUE (slug);
alter table public."product_variants" add constraint "product_variants_pkey" PRIMARY KEY (id);
alter table public."product_variants" add constraint "product_variants_price_check" CHECK ((price >= (0)::numeric));
alter table public."product_variants" add constraint "product_variants_sku_key" UNIQUE (sku);
alter table public."product_variants" add constraint "product_variants_stock_check" CHECK ((stock >= 0));
alter table public."categories" add constraint "categories_pkey" PRIMARY KEY (id);
alter table public."categories" add constraint "categories_slug_key" UNIQUE (slug);
alter table public."spec_types" add constraint "spec_types_key_key" UNIQUE (key);
alter table public."spec_types" add constraint "spec_types_pkey" PRIMARY KEY (id);
alter table public."admins" add constraint "admins_pkey" PRIMARY KEY (user_id);
alter table public."ambassadors" add constraint "ambassadors_pkey" PRIMARY KEY (id);
alter table public."product_images" add constraint "product_images_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
alter table public."product_images" add constraint "product_images_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;
alter table public."products" add constraint "products_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;
alter table public."products" add constraint "products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
alter table public."product_variants" add constraint "product_variants_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
alter table public."categories" add constraint "categories_compare_group_fkey" FOREIGN KEY (compare_group) REFERENCES categories(slug) ON UPDATE CASCADE ON DELETE SET NULL;
alter table public."categories" add constraint "categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;
alter table public."admins" add constraint "admins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX one_main_image ON public.product_images USING btree (product_id) WHERE is_main;
CREATE INDEX product_images_product_id_sort_order_idx ON public.product_images USING btree (product_id, sort_order);
CREATE INDEX products_category_id_idx ON public.products USING btree (category_id);
CREATE INDEX products_brand_id_idx ON public.products USING btree (brand_id);
CREATE INDEX products_is_published_created_at_idx ON public.products USING btree (is_published, created_at DESC);
CREATE INDEX product_variants_product_id_idx ON public.product_variants USING btree (product_id);
CREATE INDEX categories_parent_id_idx ON public.categories USING btree (parent_id);

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.admins where user_id = auth.uid())
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
revoke all on all tables in schema public from public, anon, authenticated;
grant select on public.brands, public.categories, public.products, public.product_variants, public.product_images, public.spec_types, public.ambassadors to anon;
grant select, insert, update, delete on public.brands, public.categories, public.products, public.product_variants, public.product_images, public.spec_types, public.ambassadors to authenticated;
grant all on all tables in schema public to service_role;
revoke all on public.admins from anon, authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']);

create policy "admin delete photos" on "storage"."objects" as PERMISSIVE for DELETE to "public" using (((bucket_id = 'product-images'::text) AND is_admin()));
create policy "admin update photos" on "storage"."objects" as PERMISSIVE for UPDATE to "public" using (((bucket_id = 'product-images'::text) AND is_admin()));
create policy "admin upload photos" on "storage"."objects" as PERMISSIVE for INSERT to "public" with check (((bucket_id = 'product-images'::text) AND is_admin()));
create policy "admin write images" on "storage"."objects" as PERMISSIVE for ALL to "public" using (((bucket_id = 'product-images'::text) AND is_admin())) with check (((bucket_id = 'product-images'::text) AND is_admin()));
create policy "admin all" on "public"."product_images" as PERMISSIVE for ALL to "public" using (is_admin()) with check (is_admin());
create policy "public read images" on "public"."product_images" as PERMISSIVE for SELECT to "public" using ((EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = product_images.product_id) AND p.is_published))));
create policy "admin all" on "public"."brands" as PERMISSIVE for ALL to "public" using (is_admin()) with check (is_admin());
create policy "public read" on "public"."brands" as PERMISSIVE for SELECT to "public" using (true);
create policy "admin all" on "public"."products" as PERMISSIVE for ALL to "public" using (is_admin()) with check (is_admin());
create policy "public read published" on "public"."products" as PERMISSIVE for SELECT to "public" using (is_published);
create policy "admin all" on "public"."product_variants" as PERMISSIVE for ALL to "public" using (is_admin()) with check (is_admin());
create policy "public read variants" on "public"."product_variants" as PERMISSIVE for SELECT to "public" using ((EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = product_variants.product_id) AND p.is_published))));
create policy "admin all" on "public"."categories" as PERMISSIVE for ALL to "public" using (is_admin()) with check (is_admin());
create policy "public read" on "public"."categories" as PERMISSIVE for SELECT to "public" using (true);
create policy "admin all" on "public"."spec_types" as PERMISSIVE for ALL to "public" using (is_admin()) with check (is_admin());
create policy "public read spec_types" on "public"."spec_types" as PERMISSIVE for SELECT to "public" using (true);
create policy "admin all" on "public"."ambassadors" as PERMISSIVE for ALL to "public" using (is_admin()) with check (is_admin());
create policy "public read" on "public"."ambassadors" as PERMISSIVE for SELECT to "public" using (is_published);
