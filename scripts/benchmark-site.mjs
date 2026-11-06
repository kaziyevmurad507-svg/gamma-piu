import { writeFile } from 'node:fs/promises';

const [origin = 'https://gamma-piu.vercel.app', output] = process.argv.slice(2);
const paths = ['/az', '/az/catalog', '/az/catalog?cat=clippers', '/az/product/clipper-boosted-up'];
const report = { measuredAt: new Date().toISOString(), origin, note: 'Sequential HTTP measurements from this machine; not browser LCP or a capacity test.', routes: [] };
for (const path of paths) {
  const samples = [];
  for (let i = 0; i < 6; i++) {
    const start = performance.now();
    const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(30000) });
    const headersMs = performance.now() - start;
    const bytes = (await response.arrayBuffer()).byteLength;
    samples.push({ status: response.status, headersMs: Math.round(headersMs), totalMs: Math.round(performance.now() - start), bytes, cache: response.headers.get('x-vercel-cache'), region: response.headers.get('x-vercel-id')?.split('::').slice(0, 2).join('::') });
  }
  const warm = samples.slice(1).map(s => s.totalMs).sort((a, b) => a - b);
  report.routes.push({ path, first: samples[0], warmMedianMs: warm[2], warmMaxMs: warm.at(-1), samples });
}
if (output) await writeFile(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, routes: report.routes.map(route => ({ path: route.path, first: route.first, warmMedianMs: route.warmMedianMs, warmMaxMs: route.warmMaxMs })) }, null, 2));
