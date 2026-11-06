import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

// Reuse the store's existing vector artwork; no external fonts or image service.
const source = await readFile(new URL('../src/components/layout/Logo.tsx', import.meta.url), 'utf8');
const artwork = source.slice(source.indexOf('<rect'), source.indexOf('</svg>')).replace('fill="currentColor"', 'fill="#24252b"');
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 556.6319 104.7605">${artwork}</svg>`;
await writeFile(new URL('../public/images/logo.svg', import.meta.url), logo);

const paths = [...source.matchAll(/<path d="([^"]+)"/g)].map(match => match[1]);
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="26" fill="#24252b"/><g fill="white" transform="translate(15 26) scale(.92)"><path d="${paths[1]}"/><path d="M91 8h8v15h15v8H99v15h-8V31H76v-8h15z"/></g><path fill="#009640" d="M16 104h32v8H16z"/><path fill="#f6f6f6" d="M48 104h32v8H48z"/><path fill="#e30613" d="M80 104h32v8H80z"/></svg>`;
await writeFile(new URL('../src/app/icon.svg', import.meta.url), icon);
await writeFile(new URL('../src/app/apple-icon.png', import.meta.url), await sharp(Buffer.from(icon)).resize(180, 180).png().toBuffer());

const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(size => sharp(Buffer.from(icon)).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((data, i) => {
  const at = 6 + i * 16;
  header[at] = sizes[i]; header[at + 1] = sizes[i];
  header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(data.length, at + 8); header.writeUInt32LE(offset, at + 12);
  offset += data.length;
});
await writeFile(new URL('../src/app/favicon.ico', import.meta.url), Buffer.concat([header, ...images]));

const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f4f4f6"/><rect x="60" y="60" width="1080" height="510" rx="40" fill="white"/><svg x="210" y="214" width="780" height="147" viewBox="0 0 556.6319 104.7605">${artwork}</svg><text x="600" y="433" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" letter-spacing="7" fill="#62636d">PROFESSIONAL · BAKU</text></svg>`;
await writeFile(new URL('../public/images/share-card.png', import.meta.url), await sharp(Buffer.from(card)).png().toBuffer());
console.log('Generated brand logo, favicon, SVG icon, Apple icon and share card.');
