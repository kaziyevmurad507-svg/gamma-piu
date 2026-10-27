import nextEnv from '@next/env';
import { pathToFileURL } from 'node:url';

export function validateEnvironment(env, production = false) {
  const errors = [];
  const isLocal = (host) => ['localhost', '127.0.0.1', '[::1]'].includes(host);
  for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']) {
    if (!env[name]?.trim()) errors.push(`${name} is required.`);
  }
  if (env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
      if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && !production && isLocal(url.hostname))) throw new Error();
      if (production && isLocal(url.hostname)) throw new Error();
    } catch { errors.push('NEXT_PUBLIC_SUPABASE_URL must use HTTPS (localhost is allowed for tests).'); }
  }
  const key = (env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
  if (key.startsWith('sb_secret_')) errors.push('Never use a secret key in NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  if (key.split('.').length === 3) {
    try {
      const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
      if (claims.role !== 'anon') errors.push('Only an anon JWT or publishable key may be public.');
    } catch { errors.push('Invalid public Supabase key.'); }
  } else if (key && !key.startsWith('sb_secret_') && !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    errors.push('Use a Supabase publishable key or legacy anon JWT.');
  }
  if (production || env.NEXT_PUBLIC_WHATSAPP) {
    if (!/^994\d{9}$/.test(env.NEXT_PUBLIC_WHATSAPP ?? '') || /^9940+$/.test(env.NEXT_PUBLIC_WHATSAPP ?? '')) {
      errors.push('NEXT_PUBLIC_WHATSAPP must be the real Azerbaijan number, digits only (994 + 9 digits).');
    }
  }
  if (production || env.NEXT_PUBLIC_SITE_URL) {
    try {
      const url = new URL(env.NEXT_PUBLIC_SITE_URL ?? '');
      if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error();
      if (production && (url.protocol !== 'https:' || isLocal(url.hostname) || url.hostname.endsWith('.invalid'))) throw new Error();
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch { errors.push('NEXT_PUBLIC_SITE_URL must be an origin URL; production requires a public HTTPS domain.'); }
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  nextEnv.loadEnvConfig(process.cwd());
  const production = process.argv.includes('--production') || process.env.VERCEL_ENV === 'production' || process.env.APP_ENV === 'production';
  const errors = validateEnvironment(process.env, production);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log(`Environment configuration valid (${production ? 'production' : 'local/preview'}).`);
}
