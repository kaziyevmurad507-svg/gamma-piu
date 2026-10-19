-- Run ONCE in Supabase -> SQL Editor (paste, press Run; no begin/commit).
-- Lets admins upload, replace and delete photo files in bucket product-images (visitors can still only view them).
drop policy if exists "admin upload photos" on storage.objects;
create policy "admin upload photos" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admin update photos" on storage.objects;
create policy "admin update photos" on storage.objects for update using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admin delete photos" on storage.objects;
create policy "admin delete photos" on storage.objects for delete using (bucket_id = 'product-images' and public.is_admin());

-- check: must show 3 rows
select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'admin % photos';
