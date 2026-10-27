import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';

function loadAdmin({ member = true, aal = 'aal2', user = { id: 'fixture-admin' }, authError = null } = {}) {
  const calls = [];
  const db = {
    auth: { getUser: async () => ({ data: { user }, error: authError }), mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: aal } }) } },
    rpc: async (name) => { calls.push(name); return { data: name === 'is_admin_member' ? member : member && aal === 'aal2' }; },
  };
  const moduleState = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('src/lib/admin.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { exports: moduleState.exports, module: moduleState, require: (name) => {
    if (name === 'next/navigation') return { redirect: (path) => { throw new Error(`redirect:${path}`); } };
    if (name === '@/lib/supabase/server') return { createClient: async () => db };
    throw new Error(`Unexpected dependency ${name}`);
  } });
  return { ...moduleState.exports, calls };
}
test('a password-only administrator cannot reach protected actions', async () => {
  const admin = loadAdmin({ aal: 'aal1' });
  await assert.rejects(admin.requireAdmin(), /redirect:\/admin\/mfa/);
  assert.deepEqual(admin.calls, ['is_admin_member']);
});
test('membership gate allows MFA setup but rejects non-administrators', async () => {
  await loadAdmin({ aal: 'aal1' }).requireAdminMember();
  await assert.rejects(loadAdmin({ member: false }).requireAdminMember(), /denied/);
});
test('verified administrator passes membership, assurance and database checks', async () => {
  const admin = loadAdmin();
  assert.equal((await admin.requireAdmin()).user.id, 'fixture-admin');
  assert.deepEqual(admin.calls, ['is_admin_member', 'is_admin']);
});
test('invalid or absent sessions fail closed', async () => {
  await assert.rejects(loadAdmin({ user: null }).requireAdmin(), /redirect:\/admin\/login/);
  await assert.rejects(loadAdmin({ authError: new Error('network') }).requireAdmin(), /redirect:\/admin\/login/);
});
