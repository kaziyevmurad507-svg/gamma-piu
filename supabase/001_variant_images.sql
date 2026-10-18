-- Run ONCE in Supabase -> SQL Editor.
-- variant_id empty = common photo of the product; filled = photo of that color/variant only.
alter table product_images
  add column if not exists variant_id uuid references product_variants(id) on delete cascade;
