import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const state = { exports: {} };
const code = ts.transpileModule(readFileSync('src/lib/product-description.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function('exports', code)(state.exports);
const { productDescription } = state.exports;

test('preserves an editorial description and fills missing text from product facts', () => {
  assert.equal(productDescription({ name: '7005', categoryName: 'Фены', description: '  Фен Gamma Piu  ' }), 'Фен Gamma Piu');
  assert.equal(productDescription({ name: '7005', categoryName: 'Фены', description: '  ' }), '7005 · Фены');
  assert.equal(productDescription({ name: '7005', categoryName: '', description: '' }), '7005');
});
