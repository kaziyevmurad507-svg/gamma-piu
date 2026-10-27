"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getAmbassadorRows, type AmbassadorRow } from "@/lib/admin-data";
import { removeFiles } from "@/lib/admin-storage";
import { INSTAGRAM } from "@/lib/ambassadors";

// Saves the whole list in the shown order. removedIds = ambassadors deleted in the form
export async function saveAmbassadors(rows: AmbassadorRow[], removedIds: string[]): Promise<{ error: string } | { rows: AmbassadorRow[] }> {
  const { db } = await requireAdmin();
  for (const r of rows) {
    if (!r.name.trim()) return { error: "У каждого амбассадора должно быть имя" };
    if (r.instagram.trim() && !INSTAGRAM.test(r.instagram.trim())) return { error: `«${r.name}»: Instagram введите как @имя или ссылкой https://instagram.com/имя` };
  }
  const empty = (s: string) => s.trim() || null;
  const { error } = await db.rpc("admin_save_ambassadors", {
    p_removed_ids: removedIds,
    p_rows: rows.map((r) => ({
      id: r.id || null,
      name: r.name.trim(), role_az: empty(r.role_az), role_ru: empty(r.role_ru), role_en: empty(r.role_en),
      instagram: empty(r.instagram), image_path: r.image_path || null, is_published: r.is_published,
    })),
  });
  if (error) return { error: error.message };
  await removeFiles(db);
  updateTag("storefront");
  revalidatePath("/", "layout");
  return { rows: await getAmbassadorRows(db) };
}
