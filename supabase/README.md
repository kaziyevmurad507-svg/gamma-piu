# Database rollout and recovery

## Applied release — 27 October 2026

The three migration versions listed below are now recorded on the existing Gamma + project. The baseline was recorded without replaying CREATE TABLE. The RPC/visibility and MFA migrations were applied after explicit owner approval. Hashes of all eight application tables matched before and after; 31 products, 53 variants, 248 image records and 254 Storage objects were preserved. TOTP is enabled in hosted Auth; the owner must complete authenticator enrollment through the local application.

The full isolated Supabase start/reset, build and 37 browser tests passed in GitHub Actions: https://github.com/kaziyevmurad507-svg/gamma-piu/actions/runs/40499063723. A separate local application-data snapshot and all Storage objects were verified, including an isolated restoration of the real catalog and both migrations. The Free plan has no scheduled project backups; full Auth/platform restoration remains untested. Leaked-password protection requires Pro and was not enabled.

Do not replay this release on that project. The existing-project procedure below is retained for another verified legacy environment and for recovery planning.

The canonical schema is now `supabase/migrations/`. The numbered `001_*.sql`–`006_*.sql` files are historical reference, not an installation sequence. Do not replay them after the migrations. In particular, do not re-run the original bulk product import: it deletes the existing catalog.

## Contents and verification

| Migration | Purpose |
| --- | --- |
| `20261027121312_schema_baseline.sql` | Empty application schema for a fresh Supabase project: eight original tables, constraints, indexes, trigger, RLS, explicit grants and the 5 MiB public image bucket. No business data, Auth accounts or credentials. |
| `20261027121349_atomic_admin_and_visibility.sql` | Transactional product/category/spec/ambassador/photo RPCs; hidden-category and active-variant visibility; durable image cleanup; normalized grants and Storage policies; missing FK indexes; fixed trigger search path. |
| `20261027121406_admin_mfa.sql` | Membership helper in the non-exposed `private` schema; `is_admin()` requires membership and AAL2; public enrollment helper reveals only the caller's own membership. |

The baseline was derived from read-only catalog metadata of the existing project on 21 October 2026. It deliberately normalizes table grants and function search paths rather than reproducing broad historical defaults. The application has no service-role key requirement.

`tests/backend-regressions.test.mjs` runs the exact migration files in a fresh PGlite PostgreSQL database. Supabase-owned Auth/Storage schemas are minimal fixtures; application tables, functions, grants and RLS are real SQL. The suite covers failed saves rolling back removed rows and cleanup intent, hidden-category reads, AAL1 denial, image ownership and main-photo errors, Storage reference protection and fail-closed cleanup.

A full local Supabase reset also checks the managed Auth/Storage integration. The prepared CI workflow runs this on an isolated local stack. The Windows authoring host had no running Docker daemon, so PGlite success is not a claim that a full stack reset, real MFA enrollment, production upgrade, or backup restore was executed on that host.

## Fresh local database / CI

Use Supabase CLI 2.121.0, the version used to generate these migrations and `config.toml`. The checked-in configuration is local-only, project ID `gamma-piu-local`, with TOTP enrollment and verification enabled.

With Docker running, from the repository root:

```sh
npx supabase@2.121.0 start
npx supabase@2.121.0 db reset --local
npx supabase@2.121.0 migration list --local
node --test tests/backend-regressions.test.mjs
```

`db reset --local` destroys the local database and loads `seed.sql`. Do not substitute `--linked` or a production connection string. The seed contains only synthetic fixture records: five products, six variants, a hidden category and one ambassador. It is never production content. CI uploads fixture image files separately via `scripts/prepare-ci.mjs`; SQL metadata does not create image bytes.

The CI preparation script accepts only a loopback Supabase API URL. The public API URL and publishable/anon key are passed to the application, while the local service credential is used only to prepare fixtures. Keep status JSON containing service credentials out of logs and artifacts. Do not overwrite an existing developer `.env.local` with `supabase status` output.

## Upgrade the existing project

This is a coordinated application/database release. The new actions need the RPC migration, and the new MFA page needs `is_admin_member()`. The final MFA migration makes the old application unable to administer the catalog at AAL1 until the new UI is deployed. Schedule a short pause in admin editing and prepare the new application build before applying migrations. Public catalog reading continues.

1. Verify the exact target project, current schema and migration history. At capture, the remote migration history was empty. If it has changed, reconcile it first.
2. Confirm a recent database backup and a separate copy of the actual `product-images` objects. Record counts and hashes/manifests, backup time, retention and the person responsible for restoring them. Keep backups outside the source repository.
3. Compare the current remote schema to the baseline. Confirm the original eight tables, constraints, trigger and bucket configuration. Check for any new policies or functions added since capture. Do not mark a genuinely different schema as matching without reviewing the difference.
4. Record the baseline as already applied **without executing its CREATE TABLE statements against the existing database**. With the CLI explicitly linked to the verified project, the reviewed command is:
   ```sh
   npx supabase@2.121.0 migration repair 20261027121312 --status applied --linked
   ```
   This changes migration history, not catalog rows. It is an operational release step, not a command that was run during the code changes.
5. Preview pending migrations:
   ```sh
   npx supabase@2.121.0 db push --linked --dry-run --skip-vault
   ```
   Only `atomic_admin_and_visibility` and `admin_mfa` should be pending. Do not use `--include-seed`, `--include-all`, `db reset --linked`, or the legacy import scripts.
6. Apply the two reviewed migrations, then deploy the prepared application in the same maintenance window. The reviewed command is `npx supabase@2.121.0 db push --linked --skip-vault`. Ensure TOTP is enabled in the hosted project's Auth settings; the local TOML does not configure hosted Auth.
7. Sign in as the existing administrator, enroll/verify TOTP at `/admin/mfa`, then test reading and saving a disposable record in a separate test project. Existing production prices or stock are not test fixtures. Retain a secure owner recovery procedure for loss of the authenticator; do not disable AAL2 checks to work around enrollment trouble.
8. Re-run security/performance advisors and the read-only checks below. Verify the public hidden-product URL returns 404 and the hidden item is absent from cart/WhatsApp output. Use the application release's ordinary cache invalidation; admin actions call `updateTag("storefront")`.

The core migration replaces the exact policy names captured remotely: `admin all`, `public read`, `public read spec_types`, `public read published`, `public read variants`, `public read images`; Storage policies `admin write images`, `admin upload photos`, `admin update photos`, `admin delete photos`. If another permissive policy is present, it must be reviewed before rollout, because PostgreSQL permissive policies combine with OR.

For the applied release above, schema migrations and history were updated; business rows and Storage objects were preserved. No product edits, physical file deletions, paid backup jobs or hosted Auth configuration changes were performed.

## Post-deployment read-only checks

As a database operator, inspect the effective schema:

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

select n.nspname, p.proname, p.prosecdef, p.proconfig
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
order by n.nspname, p.proname;

select indexname, indexdef from pg_indexes
where schemaname = 'public'
  and indexname in ('categories_compare_group_idx', 'product_images_variant_id_idx');

select count(*) as pending, max(attempts) as most_attempts
from public.storage_cleanup_queue;
```

The administrative helpers in the exposed `public` schema should be SECURITY INVOKER. Only `private.is_admin_member()` is SECURITY DEFINER, uses a fixed empty search path, and checks the current Auth user. Do not add `private` to exposed Data API schemas.

Verify access through actual anon/authenticated clients, not only the SQL editor's privileged role:

- anon: visible catalog only; hidden category, its products, variants and photo records absent; mutation RPC unavailable;
- authenticated non-admin: same public view, no mutations;
- admin with AAL1: `is_admin_member() = true`, `is_admin() = false`, no mutations;
- admin with AAL2: admin CRUD works, hidden rows visible in admin screens;
- a file referenced by any product image, ambassador or legacy variant image cannot be removed through the Storage delete policy.

The bucket remains public, so already-known image URLs remain accessible even when a category is hidden. Category hiding controls catalog/API visibility; it does not turn public media into private documents.

The `admins` table intentionally has RLS and no direct policies, with public API grants revoked. Its “RLS enabled, no policy” advisor item is expected. Password leak protection is a hosted Auth setting, not a SQL migration; its disabled state was still reported by the read-only advisor. Enable and verify it separately where the project plan supports it. See [Supabase password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Retrying image cleanup

Database triggers queue only exact paths whose saved references were deleted or replaced. The queue insert is part of the same transaction as the catalog change, including FK cascades. No directory sweep runs, so another browser tab's unsaved upload is never selected for cleanup merely because it lacks a database record.

After a successful save/delete, the server processes at most 100 queued paths. A failed reference query stops physical deletion. Storage errors remain in `storage_cleanup_queue.last_error` with an attempt count. The file remains queued if a network exception interrupts processing. Removing an already-absent Storage object is safe to retry.

Use **Admin → Очистка фото** (`/admin/storage`) to inspect pending paths and repeat a batch. This requires AAL2. A still-referenced path is preserved and deferred behind other queued work. There is no hidden background cron and no folder-wide orphan purge. Uploads abandoned before any row was saved are intentionally outside this queue; any future orphan cleanup must use upload-session ownership and an age threshold.

## Recovery drill and rollback

Database backups contain Storage metadata, not the image object bytes. Restore the database and files together. See [Supabase backups](https://supabase.com/docs/guides/platform/backups).

Perform the drill in an isolated project, without changing the production application endpoint:

1. Restore the appropriate application schema/migration version and data backup, together with the required Auth identity references. Keep MFA identities and admin UUID mapping consistent. Never create a default production administrator or password in a seed file.
2. Restore the image bytes with their original bucket paths and MIME types. Keep the bucket limit at 5 MiB unless both Storage and UI are deliberately changed.
3. Compare product/variant/image row counts and the object manifest with the backup. Check a representative product in all three locales, a hidden category, selected-color images, preorder, and an AAL2 admin session.
4. Run the failure/rollback tests against fixtures and test actual Storage operations on disposable fixture files. Review pending cleanup before enabling admin editing.
5. Record the backup timestamp, elapsed recovery time, any missing objects and the accepted recovery point. Only then plan the endpoint cutover.

Before the schema is modified, rollback means keeping the previous application release and stopping the rollout. After migration, prefer a reviewed forward fix. Do not drop the cleanup queue while it contains pending files, remove AAL2 enforcement, or replay the original schema/import scripts as a rollback. A database restore alone cannot recover image bytes already removed from Storage. No production backup availability, retention, or full recovery time has been confirmed by the local tests.
