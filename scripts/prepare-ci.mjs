import { readFile, appendFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

// Only the isolated CI stack is allowed here. Never use business data or hosted keys.
const rawStatus = JSON.parse(await readFile(process.argv[2], 'utf8'));
const status = rawStatus.env ?? rawStatus;
const url = status.API_URL ?? status.api?.url ?? status['api.url'];
if (!url || new URL(url).hostname !== '127.0.0.1' || !process.env.GITHUB_ENV) {
  throw new Error('Synthetic storage fixtures may only be prepared on the local CI stack.');
}
const publicKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY ?? status.auth?.publishable_key ?? status.auth?.anon_key;
const serviceKey = status.SERVICE_ROLE_KEY ?? status.auth?.service_role_key;
if (!publicKey || !serviceKey) throw new Error('Local Supabase status is missing test keys.');
await appendFile(process.env.GITHUB_ENV, `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publicKey}\n`);
const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAvUlEQVR4nOXOIQEAIBAAseuf8TWeBHyMCcT8mnPfz9IBLR3Q0gEtHdDSAS0d0NIBLR3Q0gEtHdDSAS0d0NIBLR3Q0gEtHdDSAS0d0NIBLR3Q0gEtHdDSAS0d0NIBLR3Q0gEtHdDSAS0d0NIBLR3Q0gEtHdDSAS0d0NIBLR3Q0gEtHdDSAS0d0NIBLR3Q0gEtHdDSAS0d0NIBLR3Q0gEtHdDSAS0d0NIBLR3Q0gEtHdDSAS0d0NIBLR3Q0gFtAfFhI3Y7nNEDAAAAAElFTkSuQmCC', 'base64');
for (const path of ['fixture-clipper/black.png', 'fixture-clipper/white.png', 'fixture-dryer/black.png', 'fixture-hidden/black.png', 'ambassadors/old.png']) {
  const { error } = await db.storage.from('product-images').upload(path, pixel, { contentType: 'image/png', upsert: true });
  if (error) throw new Error(`Could not prepare synthetic image: ${error.message}`);
}
console.log('Local CI public configuration and synthetic photos prepared.');
