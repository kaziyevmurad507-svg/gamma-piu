"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getAmbassadorRows, type AmbassadorRow } from "@/lib/admin-data";
import { BUCKET } from "@/lib/admin-storage";
import { INSTAGRAM } from "@/lib/ambassadors";

// Saves the whole list in the shown order. removedIds = ambassadors deleted in the form
export async function saveAmbassadors(rows: AmbassadorRow[], removedIds: string[]): Promise<{ error: string } | { rows: AmbassadorRow[] }> {
  const { db } = await requireAdmin();
  for (const r of rows) {
    if (!r.name.trim()) return { error: "У каждого амбассадора должно быть имя" };
    if (r.instagram.trim() && !INSTAGRAM.test(r.instagram.trim())) return { error: `«${r.name}»: Instagram введите как @имя или ссылкой https://instagram.com/имя` };
  }
  if (removedIds.length) {
    const { error } = await db.from("ambassadors").delete().in("id", removedIds);
    if (error) return { error: error.message };
  }
  const empty = (s: string) => s.trim() || null;
  for (const [i, r] of rows.entries()) {
    const v = {
      name: r.name.trim(), role_az: empty(r.role_az), role_ru: empty(r.role_ru), role_en: empty(r.role_en),
      instagram: empty(r.instagram), image_path: r.image_path || null, is_published: r.is_published, sort_order: i,
    };
    const { error } = r.id ? await db.from("ambassadors").update(v).eq("id", r.id) : await db.from("ambassadors").insert(v);
    if (error) return { error: error.message };
  }
  // delete photo files that no ambassador uses any more (replaced, removed or uploaded but never saved)
  const [{ data: files }, { data: used }] = await Promise.all([
    db.storage.from(BUCKET).list("ambassadors", { limit: 1000 }),
    db.from("ambassadors").select("image_path"),
  ]);
  const keep = new Set((used ?? []).map((u) => u.image_path));
  const junk = (files ?? []).map((f) => `ambassadors/${f.name}`).filter((p) => !keep.has(p));
  if (junk.length) await db.storage.from(BUCKET).remove(junk);
  revalidatePath("/", "layout");
  return { rows: await getAmbassadorRows(db) };
}
