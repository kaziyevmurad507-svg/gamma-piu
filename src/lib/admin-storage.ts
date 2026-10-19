import type { SupabaseClient } from "@supabase/supabase-js";

export const BUCKET = "product-images";

// Deletes files from Storage, but keeps a file that another photo record still uses
export async function removeFiles(db: SupabaseClient, paths: string[]) {
  if (!paths.length) return;
  const { data } = await db.from("product_images").select("path").in("path", paths);
  const used = new Set((data ?? []).map((r) => r.path));
  const free = paths.filter((p) => !used.has(p));
  if (free.length) await db.storage.from(BUCKET).remove(free);
}
