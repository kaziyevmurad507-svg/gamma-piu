-- Deploy the /admin/mfa enrollment/challenge UI with this migration.
-- Membership remains readable at AAL1 for enrollment, all data access needs AAL2.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
create function private.is_admin_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.admins where user_id = auth.uid())
$$;
revoke all on function private.is_admin_member() from public, anon, authenticated;
grant execute on function private.is_admin_member() to anon, authenticated;
create function public.is_admin_member() returns boolean
language sql stable security invoker set search_path = '' as $$
  select private.is_admin_member()
$$;
revoke all on function public.is_admin_member() from public, anon, authenticated;
grant execute on function public.is_admin_member() to authenticated;
create or replace function public.is_admin() returns boolean
language sql stable security invoker set search_path = '' as $$
  select private.is_admin_member() and coalesce(auth.jwt()->>'aal' = 'aal2',false)
$$;
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

