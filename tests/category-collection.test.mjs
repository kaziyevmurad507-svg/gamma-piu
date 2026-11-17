import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function collectionReader(categories) {
  const calls = [];
  const moduleState = { exports: {} };
  const dependencies = {
    react: { cache: (fn) => fn },
    'next-intl': { hasLocale: (locales, locale) => locales.includes(locale) },
    '@/i18n/routing': { routing: { locales: ['az', 'ru', 'en'] } },
    './category-data': { getCategories: async (locale) => { calls.push({ type: 'categories', locale }); return categories; } },
    './catalog': { getCatalogPage: async (...args) => { calls.push({ type: 'products', args }); return { products: [], total: 0, page: 1, pages: 1 }; } },
  };
  const code = ts.transpileModule(readFileSync('src/lib/category-collection.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'exports', code)((name) => dependencies[name], moduleState.exports);
  return { read: moduleState.exports.getCategoryCollection, calls };
}

test('category routes reject unsupported locales and categories absent from the public reader before loading products', async () => {
  const { read, calls } = collectionReader([{ slug: 'dryers', name: 'Фены', hidden: false }]);
  assert.equal(await read('xx', 'dryers', 1), null);
  assert.equal(calls.length, 0);
  assert.equal(await read('ru', 'hidden-or-missing', 1), null);
  assert.equal(calls.filter((call) => call.type === 'products').length, 0);
});

test('a public category collection stays scoped to its own products and passes pagination to the existing catalog reader', async () => {
  const { read, calls } = collectionReader([{ slug: 'dryers', name: 'Фены', hidden: false }]);
  const data = await read('ru', 'dryers', 3);
  assert.equal(data.category.slug, 'dryers');
  assert.deepEqual(calls.find((call) => call.type === 'products').args, ['ru', { cats: ['dryers'] }, 3]);
  assert.equal(data.total, 0);
});
