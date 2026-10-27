import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const nativeRequire = createRequire(import.meta.url);
const source = resolve('src');
function loader(overrides = {}) {
  const modules = new Map();
  function load(file) {
    file = file.endsWith('.ts') ? file : `${file}.ts`;
    if (modules.has(file)) return modules.get(file).exports;
    const moduleState = { exports: {} };
    modules.set(file, moduleState);
    const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const require = (name) => {
      if (name in overrides) return overrides[name];
      if (name === 'server-only') return {};
      if (name.startsWith('@/')) return load(resolve(source, name.slice(2)));
      if (name.startsWith('.')) return load(resolve(dirname(file), name));
      return nativeRequire(name);
    };
    new Function('require', 'module', 'exports', code)(require, moduleState, moduleState.exports);
    return moduleState.exports;
  }
  return (path) => load(resolve(source, path));
}
const load = loader();
const { selectCatalogVariant, selectVariantImage } = load('lib/catalog-selection');
const { reconcileCart, sanitizeCart, sanitizeIds, quantityLimit } = load('lib/cart-policy');
const id = (number) => `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
const variant = (number, price, stock, name_en = 'Black') => ({ id: id(number), name_en, price, stock, is_active: true });

test('card selects one available variant; price, availability and color filters remain coherent', () => {
  const variants = [variant(1, 90, 0, 'Silver'), variant(2, 120, 2, 'Black'), variant(3, 110, 4, 'Red')];
  assert.equal(selectCatalogVariant(variants).id, id(3));
  assert.equal(selectCatalogVariant(variants, ['black']).id, id(2));
  assert.equal(selectCatalogVariant(variants, [], ['order']).id, id(1));
  assert.equal(selectCatalogVariant(variants, ['silver'], ['stock']), undefined);
  assert.equal(selectCatalogVariant([{ ...variants[0], is_active: false }]), undefined);
});

test('a main photo from another variant cannot misrepresent the purchased variant', () => {
  const images = [
    { variant_id: id(1), is_main: true, sort_order: 0, path: 'silver.jpg' },
    { variant_id: id(2), is_main: false, sort_order: 1, path: 'black.jpg' },
    { variant_id: null, is_main: false, sort_order: 2, path: 'common.jpg' },
  ];
  assert.equal(selectVariantImage(images, id(2)).path, 'black.jpg');
  assert.equal(selectVariantImage(images, id(3)).path, 'common.jpg');
  assert.equal(selectVariantImage(images.slice(0, 1), id(2)), undefined);
});

test('cart reconciliation caps stock, allows at most ten preorder units, removes unavailable rows', () => {
  const result = reconcileCart([{ id: id(1), qty: 99 }, { id: id(2), qty: 77 }, { id: id(3), qty: 1 }], [{ id: id(1), stock: 2 }, { id: id(2), stock: 0 }]);
  assert.deepEqual(result.map(({ id, qty }) => ({ id, qty })), [{ id: id(1), qty: 2 }, { id: id(2), qty: 10 }]);
  assert.equal(quantityLimit(0), 10);
  assert.equal(quantityLimit(3), 3);
});

test('malformed browser storage is normalized without crashing or accepting invalid quantities', () => {
  assert.deepEqual(sanitizeIds('bad'), []);
  assert.deepEqual(sanitizeCart(null), []);
  assert.deepEqual(sanitizeCart([{ id: 'invalid', qty: 1 }, { id: id(1), qty: -2 }, { id: id(1), qty: 3.7 }]), [{ id: id(1), qty: 4 }]);
  assert.deepEqual(sanitizeCart([{ id: id(2), qty: 'nope' }]), [{ id: id(2), qty: 1 }]);
});

test('repeated card, product, bulk and undo adds cannot bypass stock limits', () => {
  const previous = { localStorage: globalThis.localStorage, window: globalThis.window };
  const storage = new Map();
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  globalThis.window = new EventTarget();
  try {
    const store = loader()('lib/store');
    store.addToCart(id(1), 1, 2);
    store.addToCart(id(1), 10, 2);
    store.addManyToCart([{ variantId: id(1), stock: 2 }, { variantId: id(2), stock: 0 }]);
    store.restoreLine(id(1), 4, 2);
    store.setQty(id(2), 99, 0);
    assert.deepEqual(JSON.parse(storage.get('gp-store')).cart, [{ id: id(1), qty: 2 }, { id: id(2), qty: 10 }]);
    // A response to an old ID list must not remove items added while it loaded.
    assert.equal(store.syncCart([], [id(1)]), false);
    assert.equal(JSON.parse(storage.get('gp-store')).cart.length, 2);
    assert.equal(store.replaceValidatedCart([{ id: id(1), qty: 1 }], []), false);
    assert.equal(JSON.parse(storage.get('gp-store')).cart.length, 2);
  } finally { globalThis.localStorage = previous.localStorage; globalThis.window = previous.window; }
});

function mockDatabase(handler) {
  const calls = [];
  const client = { storage: { from: () => ({ getPublicUrl: (path) => ({ data: { publicUrl: `https://images.test/${path}` } }) }) }, from(table) {
    const call = { table, filters: {}, select: '', offset: 0, end: Infinity };
    const chain = {
      select(value) { call.select = value; return chain; },
      eq(key, value) { call.filters[key] = value; return chain; },
      in(key, value) { call.filters[key] = value; return chain; },
      order() { return chain; }, or() { return chain; },
      range(offset, end) { call.offset = offset; call.end = end; return chain; },
      maybeSingle() { call.single = true; return chain; },
      then(resolve, reject) { calls.push(call); return Promise.resolve(handler(call)).then(resolve, reject); },
    };
    return chain;
  } };
  return { calls, client, load: loader({ '@/lib/supabase/public': { createPublicClient: () => client } }) };
}

test('catalog pages beyond item 100 are reachable, count is correct and heavy rows load only for the visible page', async () => {
  const index = Array.from({ length: 241 }, (_, number) => ({ id: id(number + 1), is_featured: false, categories: { slug: 'clippers' }, product_variants: [variant(number + 1, 100 + number, 2)] }));
  const db = mockDatabase((query) => {
    assert.equal(query.filters.is_published, true);
    assert.equal(query.filters['categories.is_hidden'], false);
    if (query.select.includes('product_variants(')) return { data: index.slice(query.offset, query.end + 1), error: null };
    assert.equal(query.select.includes('specs'), false);
    assert.equal(query.filters.id.length, 24);
    return { data: query.filters.id.map((id) => ({ id, slug: id, name_en: id, name_az: id, name_ru: id, categories: { slug: 'clippers', name_en: 'Clippers', compare_group: null }, product_images: [] })), error: null };
  });
  const result = await db.load('lib/catalog').getCatalogPage('en', {}, 6);
  assert.equal(result.total, 241);
  assert.equal(result.pages, 11);
  assert.equal(result.products.length, 24);
  assert.equal(result.products[0].id, id(121));
  assert.equal(db.calls.filter((query) => query.select.includes('product_variants(')).length, 2);
});

test('direct product and cart reads enforce hidden category and active/public visibility', async () => {
  const db = mockDatabase((query) => {
    if (query.table === 'products') {
      assert.equal(query.filters['categories.is_hidden'], false);
      assert.equal(query.filters.is_published, true);
      assert.ok(query.select.includes('categories!inner'));
    } else {
      assert.equal(query.filters['products.categories.is_hidden'], false);
      assert.equal(query.filters['products.is_published'], true);
      assert.equal(query.filters.is_active, true);
    }
    return { data: query.single ? null : [], error: null };
  });
  assert.equal(await db.load('lib/product').getProduct('en', 'hidden-product'), null);
  assert.deepEqual(await db.load('lib/cart').getCartLines('en', [id(1)]), []);
});

test('database failures reject instead of masquerading as empty carts or 404 products', async () => {
  const db = mockDatabase(() => ({ data: null, error: new Error('network failed') }));
  await assert.rejects(db.load('lib/product').getProduct('en', 'product'), /network failed/);
  await assert.rejects(db.load('lib/cart').getCartLines('en', [id(1)]), /network failed/);
});

test('public reads have no auth session and checkout reads bypass the cache', async () => {
  const options = [];
  const requests = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => { requests.push(init); return new Response('[]'); };
  try {
    const publicModule = loader({ '@supabase/supabase-js': { createClient: (_url, _key, config) => { options.push(config); return config; } } })('lib/supabase/public');
    const cached = publicModule.createPublicClient();
    const fresh = publicModule.createPublicClient({ fresh: true });
    await cached.global.fetch('https://fixture.test/rest/v1/products', { method: 'GET' });
    await fresh.global.fetch('https://fixture.test/rest/v1/product_variants', { method: 'GET' });
    assert.deepEqual(options[0].auth, { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
    assert.equal('cookies' in options[0], false);
    assert.equal(requests[0].cache, 'force-cache');
    assert.deepEqual(requests[0].next.tags, ['storefront']);
    assert.equal(requests[0].next.revalidate, 60);
    assert.equal(requests[1].cache, 'no-store');
    assert.equal(requests[1].next, undefined);
  } finally { globalThis.fetch = previousFetch; }
});

test('server actions retain more than fifty favorites and revalidate complete cart contents', async () => {
  const actions = loader({
    './catalog': { getProductsByIds: async (_locale, ids) => ids },
    './cart': { getCartLines: async () => [{ id: id(1), price: 275, stock: 2 }, { id: id(2), price: 100, stock: 0 }] },
  })('lib/actions');
  const ids = Array.from({ length: 73 }, (_, number) => id(number + 1));
  assert.equal((await actions.loadProducts('en', ids)).length, 73);
  assert.deepEqual(await actions.validateCart('ru', [{ id: id(1), qty: 5 }, { id: id(2), qty: 12 }, { id: id(3), qty: 1 }]), [
    { id: id(1), price: 275, stock: 2, qty: 2 }, { id: id(2), price: 100, stock: 0, qty: 10 },
  ]);
  await assert.rejects(actions.validateCart('en', [{ id: id(1), qty: -1 }]));
});
