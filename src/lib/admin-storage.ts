import type { SupabaseClient } from "@supabase/supabase-js";

export const BUCKET = "product-images";
type CleanupResult = { removed: number; pending: boolean };

// Only committed deletions/replacements enter this durable queue. Never sweep a
// folder: another tab may have uploaded a photo which is not saved in a row yet.
// paths is retained for older category callers; database triggers own enqueueing.
export async function removeFiles(db: SupabaseClient, paths?: string[]): Promise<CleanupResult> {
  try {
    return await processFiles(db, paths);
  } catch {
    // Network exceptions after a commit must not turn a successful edit into a
    // misleading save error. The durable queue is left intact for another try.
    console.warn("Storage cleanup interrupted; queued files preserved");
    return { removed: 0, pending: true };
  }
}

async function processFiles(db: SupabaseClient, paths?: string[]): Promise<CleanupResult> {
  let queueQuery = db.from("storage_cleanup_queue").select("path, attempts").order("created_at").limit(100);
  if (paths?.length) queueQuery = queueQuery.in("path", [...new Set(paths)]);
  const { data: queued, error: queueError } = await queueQuery;
  if (queueError || !queued) {
    console.warn("Storage cleanup queue unavailable; files preserved", queueError?.code);
    return { removed: 0, pending: true };
  }
  if (!queued.length) return { removed: 0, pending: false };
  const candidates = queued.map((row) => row.path as string);
  // Every reference table must be readable. null/error never means "unused".
  const refs = await Promise.all([
    db.from("product_images").select("path").in("path", candidates),
    db.from("ambassadors").select("image_path").in("image_path", candidates),
    db.from("product_variants").select("image_path").in("image_path", candidates),
  ]);
  const failure = refs.find((result) => result.error || !result.data);
  if (failure) {
    await recordFailure(db, queued, failure.error?.message ?? "Reference lookup returned no result");
    return { removed: 0, pending: true };
  }
  const used = new Set<string>([
    ...(refs[0].data ?? []).map((row) => row.path),
    ...(refs[1].data ?? []).map((row) => row.image_path),
    ...(refs[2].data ?? []).map((row) => row.image_path),
  ].filter((path): path is string => typeof path === "string"));
  const free = candidates.filter((path) => !used.has(path));
  // Still-referenced entries can arise when paths are shared. Move them behind
  // other work so they cannot starve the queue's first batch.
  const retained = candidates.filter((path) => used.has(path));
  if (retained.length) {
    const { error: deferError } = await db.from("storage_cleanup_queue")
      .update({ created_at: new Date().toISOString() }).in("path", retained);
    if (deferError) console.warn("Storage cleanup defer failed", deferError.code);
  }
  if (!free.length) return { removed: 0, pending: true };
  const { error } = await db.storage.from(BUCKET).remove(free);
  if (error) {
    await recordFailure(db, queued.filter((row) => free.includes(row.path)), error.message);
    return { removed: 0, pending: true };
  }
  const { error: acknowledgeError } = await db.from("storage_cleanup_queue").delete().in("path", free);
  // Failed acknowledgement is safe: Storage remove is idempotent.
  if (acknowledgeError) console.warn("Storage cleanup acknowledgement failed", acknowledgeError.code);
  return { removed: free.length, pending: !!acknowledgeError || free.length < queued.length || queued.length === 100 };
}

async function recordFailure(db: SupabaseClient, rows: { path: string; attempts: number }[], message: string) {
  for (const row of rows) {
    const { error } = await db.from("storage_cleanup_queue").update({
      attempts: row.attempts + 1,
      last_error: message.slice(0, 1000),
    }).eq("path", row.path);
    if (error) console.warn("Storage cleanup retry state unavailable", error.code);
  }
}
