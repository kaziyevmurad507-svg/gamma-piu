import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEnvironment } from '../scripts/validate-env.mjs';

const valid = { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture', NEXT_PUBLIC_SITE_URL: 'https://gammapiu.az', NEXT_PUBLIC_WHATSAPP: '994501234567' };
test('production rejects missing order number and localhost canonical', () => {
  const errors = validateEnvironment({ ...valid, NEXT_PUBLIC_WHATSAPP: '', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' }, true);
  assert.equal(errors.length, 2);
});
test('production rejects a private Supabase key without printing it', () => {
  const errors = validateEnvironment({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_fixture' }, true);
  assert.ok(errors.some((error) => error.includes('secret key')));
  assert.ok(errors.every((error) => !error.includes('sb_secret_fixture')));
});
test('production accepts configured public values; local tests accept local Supabase', () => {
  assert.deepEqual(validateEnvironment(valid, true), []);
  assert.deepEqual(validateEnvironment({ ...valid, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321' }), []);
});
test('production rejects test number and canonical URL with path', () => {
  assert.equal(validateEnvironment({ ...valid, NEXT_PUBLIC_WHATSAPP: '994000000000', NEXT_PUBLIC_SITE_URL: 'https://gammapiu.az/catalog' }, true).length, 2);
});
test('whitespace cannot hide a secret key and Supabase URL must be an origin', () => {
  assert.ok(validateEnvironment({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '  sb_secret_fixture  ' }, true).some((error) => error.includes('secret key')));
  assert.equal(validateEnvironment({ ...valid, NEXT_PUBLIC_SUPABASE_URL: 'https://user:password@example.supabase.co/rest/v1' }, true).length, 1);
  assert.equal(validateEnvironment({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'not-a-key' }, true).length, 1);
});
