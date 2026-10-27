import { before, beforeEach, after, test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import ts from "typescript";

// Real PostgreSQL execution in memory, no network or live catalog credentials.
const pg = new PGlite();
const adminId = "70000000-0000-4000-8000-000000000001";
const productId = "30000000-0000-4000-8000-000000000001";
const categoryId = "20000000-0000-4000-8000-000000000001";
const variantId = "40000000-0000-4000-8000-000000000001";
const imageId = "50000000-0000-4000-8000-000000000001";
const migrations = new URL("../supabase/migrations/", import.meta.url);
const seed = await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8");
const storageSource = await readFile(new URL("../src/lib/admin-storage.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(storageSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { removeFiles } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));

before(async () => {
  // Only Supabase-owned schemas/roles are stubs; all application DDL is the exact migration SQL.
  await pg.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    alter default privileges in schema public grant all on tables to anon,authenticated;
    alter default privileges in schema public grant execute on functions to anon,authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    grant usage on schema auth,storage to anon,authenticated,service_role;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
  `);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith(".sql")).sort()) {
    await pg.exec(await readFile(new URL(file, migrations), "utf8"));
  }
  await pg.query("insert into auth.users(id) values($1)", [adminId]);
  await pg.query("insert into public.admins(user_id) values($1)", [adminId]);
});
beforeEach(async () => {
  await pg.exec("reset role; truncate public.product_images,public.product_variants,public.products,public.categories,public.brands,public.ambassadors,public.spec_types,public.storage_cleanup_queue,storage.objects cascade");
  await pg.exec(seed);
  await pg.query("select set_config('request.jwt.claim.sub',$1,false)", [adminId]);
  await pg.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub: adminId, aal: "aal2" })]);
  await pg.exec("set role authenticated");
});
after(() => pg.close());

const product = { category_id: categoryId, brand_id: null, slug: "new-fixture", name_az: "Changed name", name_ru: null, name_en: null, description_az: null, description_ru: null, description_en: null, is_published: true, is_new: false, is_featured: false, specs: {} };
const variant = { id: variantId, sku: "FIXTURE-BLACK", name_az: "Black", name_ru: null, name_en: "Black", price: 99, stock: 1, is_active: true, sort_order: 0 };
const save = (p = product, v = [variant], id = productId, isNew = false) =>
  pg.query("select public.admin_save_product($1,$2::jsonb,$3::jsonb,$4)", [id, JSON.stringify(p), JSON.stringify(v), isNew]);
const snapshot = async () => (await pg.query(`
  select jsonb_build_object(
    'product',(select to_jsonb(p) from public.products p where id='${productId}'),
    'variants',(select jsonb_agg(to_jsonb(v) order by id) from public.product_variants v where product_id='${productId}'),
    'images',(select jsonb_agg(to_jsonb(i) order by id) from public.product_images i where product_id='${productId}'),
    'queue',(select jsonb_agg(to_jsonb(q) order by path) from public.storage_cleanup_queue q)) as state
`)).rows[0].state;

test("SKU conflict rolls back product, removed variant, photos and cleanup intent", async () => {
  const before = await snapshot();
  await assert.rejects(save(product, [{ ...variant, sku: "FIXTURE-DRYER" }]), /unique constraint/);
  assert.deepEqual(await snapshot(), before);
});

test("new product SKU conflict leaves no half-created product", async () => {
  const id = "30000000-0000-4000-8000-000000000009";
  await assert.rejects(save(product, [{ ...variant, id: "40000000-0000-4000-8000-000000000009", sku: "FIXTURE-DRYER" }], id, true), /unique constraint/);
  assert.equal((await pg.query("select count(*)::int as n from public.products where id=$1", [id])).rows[0].n, 0);
});

test("successful save commits exact removed image path to retry queue", async () => {
  await save();
  assert.equal((await pg.query("select count(*)::int as n from public.product_variants where product_id=$1", [productId])).rows[0].n, 1);
  assert.deepEqual((await pg.query("select path from public.storage_cleanup_queue")).rows, [{ path: "fixture-clipper/white.png" }]);
});

test("category validation failure rolls back removed products, variants, images and cleanup queue", async () => {
  const before = await snapshot();
  await assert.rejects(pg.query("select public.admin_save_categories($1::jsonb,$2::uuid[])", [
    JSON.stringify([{ id: null, slug: "invalid slug!", name_az: "Bad", is_hidden: false, compare_group: null }]),
    [categoryId],
  ]), /Invalid category/);
  assert.deepEqual(await snapshot(), before);
  assert.equal((await pg.query("select count(*)::int as n from public.categories where id=$1", [categoryId])).rows[0].n, 1);
});

test("spec validation failure rolls back deletions and earlier changes", async () => {
  await pg.exec("insert into public.spec_types(key,label_az) values('power','Power')");
  await assert.rejects(pg.query("select public.admin_save_spec_types($1::jsonb)", [
    JSON.stringify([{ key: "weight", label_az: "Weight" }, { key: "bad-key", label_az: "Invalid" }]),
  ]), /Invalid specification/);
  assert.deepEqual((await pg.query("select key,label_az from public.spec_types")).rows, [{ key: "power", label_az: "Power" }]);
});

test("a foreign variant cannot be reassigned to another product", async () => {
  const before = await snapshot();
  await assert.rejects(save(product, [{ ...variant, id: "40000000-0000-4000-8000-000000000003" }]), /another product/);
  assert.deepEqual(await snapshot(), before);
});

test("invalid main photo keeps the previous main photo", async () => {
  await assert.rejects(pg.query("select public.admin_set_main_image($1,$2)", [productId, "50000000-0000-4000-8000-000000000003"]), /Image not found/);
  assert.deepEqual((await pg.query("select id from public.product_images where product_id=$1 and is_main", [productId])).rows, [{ id: imageId }]);
});

test("image belonging to another product is rejected atomically", async () => {
  await assert.rejects(pg.query("select public.admin_add_images($1,$2::jsonb)", [productId, JSON.stringify([{ path: "fixture-clipper/new.png", variantId: "40000000-0000-4000-8000-000000000003" }])]), /Invalid image or variant/);
  assert.equal((await pg.query("select count(*)::int as n from public.product_images where product_id=$1", [productId])).rows[0].n, 2);
});

test("ambassador replacement queues only the previously referenced image", async () => {
  await pg.query("select public.admin_save_ambassadors($1::jsonb,$2::uuid[])", [JSON.stringify([{ id: "60000000-0000-4000-8000-000000000001", name: "Fixture", image_path: "ambassadors/new.png", is_published: true }]), []]);
  assert.deepEqual((await pg.query("select path from public.storage_cleanup_queue")).rows, [{ path: "ambassadors/old.png" }]);
});

test("anonymous users cannot read products, variants or photos of a hidden category", async () => {
  await pg.exec("reset role; set role anon");
  await pg.query("select set_config('request.jwt.claim.sub','',false),set_config('request.jwt.claims','{}',false)");
  for (const table of ["products", "product_variants", "product_images"]) {
    const field = table === "products" ? "id" : "product_id";
    assert.equal((await pg.query(`select count(*)::int as n from public.${table} where ${field}='30000000-0000-4000-8000-000000000003'`)).rows[0].n, 0);
  }
  assert.equal((await pg.query("select count(*)::int as n from public.products")).rows[0].n, 4);
  await assert.rejects(save(), /permission denied/);
});

test("AAL1 member may enroll MFA but cannot mutate catalog or read hidden products", async () => {
  await pg.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub: adminId, aal: "aal1" })]);
  assert.deepEqual((await pg.query("select public.is_admin_member() as member,public.is_admin() as admin")).rows, [{ member: true, admin: false }]);
  await assert.rejects(save(), /Admin access required/);
  assert.equal((await pg.query("select count(*)::int as n from public.products")).rows[0].n, 4);
});

test("storage RLS refuses deleting a file that still has a reference", async () => {
  await pg.query("insert into storage.objects(bucket_id,name) values('product-images',$1)", ["fixture-clipper/black.png"]);
  assert.equal((await pg.query("delete from storage.objects where name=$1 returning id", ["fixture-clipper/black.png"])).rows.length, 0);
});

function storageFixture({ lookupError = null, storageError = null, used = [] } = {}) {
  const deleted = [], updates = [], acknowledgements = [];
  const rows = [{ path: "ambassadors/old.png", attempts: 0 }];
  const db = {
    from(table) {
      let operation = "select", values;
      const query = {
        select() { return query; }, order() { return query; }, limit() { return query; },
        in() { return query; }, eq() { return query; },
        update(value) { operation = "update"; values = value; return query; },
        delete() { operation = "delete"; return query; },
        then(resolve) {
          if (operation === "update") { updates.push(values); return Promise.resolve(resolve({ error: null })); }
          if (operation === "delete") { acknowledgements.push(table); return Promise.resolve(resolve({ error: null })); }
          if (table === "storage_cleanup_queue") return Promise.resolve(resolve({ data: rows, error: null }));
          return Promise.resolve(resolve({ data: lookupError ? null : used.map((path) => ({ path, image_path: path })), error: lookupError }));
        },
      };
      return query;
    },
    storage: { from() { return { remove: async (paths) => { deleted.push(...paths); return { error: storageError }; }, list: () => { throw new Error("Folder sweeps forbidden"); } }; } },
  };
  return { db, deleted, updates, acknowledgements };
}

test("reference lookup error performs no Storage DELETE and preserves retry", async () => {
  const fixture = storageFixture({ lookupError: { message: "database unavailable" } });
  assert.deepEqual(await removeFiles(fixture.db), { removed: 0, pending: true });
  assert.deepEqual(fixture.deleted, []);
  assert.deepEqual(fixture.acknowledgements, []);
  assert.equal(fixture.updates[0].last_error, "database unavailable");
});

test("Storage failure is recorded without acknowledging cleanup", async () => {
  const fixture = storageFixture({ storageError: { message: "temporary storage failure" } });
  assert.equal((await removeFiles(fixture.db)).pending, true);
  assert.deepEqual(fixture.acknowledgements, []);
  assert.equal(fixture.updates[0].attempts, 1);
});

test("cleanup never removes a still-used image or lists other tabs' uploads", async () => {
  const fixture = storageFixture({ used: ["ambassadors/old.png"] });
  await removeFiles(fixture.db);
  assert.deepEqual(fixture.deleted, []);
});

test("successful cleanup acknowledges only the exact queued path", async () => {
  const fixture = storageFixture();
  assert.deepEqual(await removeFiles(fixture.db), { removed: 1, pending: false });
  assert.deepEqual(fixture.deleted, ["ambassadors/old.png"]);
  assert.deepEqual(fixture.acknowledgements, ["storage_cleanup_queue"]);
});
