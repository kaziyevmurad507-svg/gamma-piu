"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getCategoryRows, type CategoryRow } from "@/lib/admin-data";
import { removeFiles } from "@/lib/admin-storage";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function validate(rows: CategoryRow[]) {
  const slugs = new Map(rows.map((r) => [r.slug.trim(), r]));
  if (slugs.size !== rows.length) return "Адреса (slug) категорий не должны повторяться";
  for (const r of rows) {
    const slug = r.slug.trim();
    if (!SLUG.test(slug)) return `Адрес «${slug}»: только маленькие латинские буквы, цифры и дефис`;
    if (!r.name_az.trim()) return `«${slug}»: введите название (AZ)`;
    if (r.compare_group) {
      const target = slugs.get(r.compare_group);
      if (r.compare_group === slug) return `«${slug}»: нельзя сравнивать категорию с самой собой`;
      if (!target) return `«${slug}»: выбранной для сравнения категории нет`;
      if (target.compare_group) return `«${slug}»: «${target.slug}» сама сравнивается с другой категорией. Выберите главную`;
    }
  }
  return null;
}

// Saves the whole list. removedIds = categories deleted in the form: their products (with variants, photo records and photo files) are deleted too
export async function saveCategories(rows: CategoryRow[], removedIds: string[]): Promise<{ error: string } | { rows: CategoryRow[] }> {
  const { db } = await requireAdmin();
  const problem = validate(rows);
  if (problem) return { error: problem };

  const empty = (s: string) => s.trim() || null;
  const { error } = await db.rpc("admin_save_categories", {
    p_removed_ids: removedIds,
    p_rows: rows.map((r) => ({
      id: r.id, slug: r.slug.trim(), name_az: r.name_az.trim(), name_ru: empty(r.name_ru),
      name_en: empty(r.name_en), is_hidden: r.is_hidden, compare_group: r.compare_group || null,
    })),
  });
  if (error) return { error: error.message };
  await removeFiles(db);
  updateTag("storefront");
  revalidatePath("/", "layout");
  return { rows: await getCategoryRows(db) };
}
