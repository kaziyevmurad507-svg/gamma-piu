// Uploads every photo from a folder (keeping subfolders) to the Storage bucket.
// Run: node --env-file=.env.local tools/upload_photos.mjs F:\GammaPiu_upload
// Needs env var SUPABASE_SERVICE_KEY (set it only in your terminal, never save it in a file).
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.argv[2];
const KEY = process.env.SUPABASE_SERVICE_KEY;
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!ROOT || !KEY || !URL) throw new Error("Missing folder argument, SUPABASE_SERVICE_KEY or NEXT_PUBLIC_SUPABASE_URL");

const db = createClient(URL, KEY);
const TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
let ok = 0, failed = 0;

// Go through folders; upload files as "folder/file.jpg"
async function walk(dir, rel = "") {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const remote = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) { await walk(path.join(dir, e.name), remote); continue; }
    const type = TYPES[path.extname(e.name).slice(1).toLowerCase()];
    if (!type) continue; // skip non-images
    const body = await fs.readFile(path.join(dir, e.name));
    const { error } = await db.storage.from("product-images").upload(remote, body, { upsert: true, contentType: type });
    if (error) { failed++; console.log(`FAIL ${remote}: ${error.message}`); } else { ok++; console.log(`ok   ${remote}`); }
  }
}

await walk(ROOT);
console.log(`\nDone: ${ok} uploaded, ${failed} failed`);
