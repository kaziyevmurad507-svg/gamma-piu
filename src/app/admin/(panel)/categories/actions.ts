"use server";
import { revalidatePath } from "next/cache";
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

  if (removedIds.length) {
    const { data: prods } = await db.from("products").select("id").in("category_id", removedIds);
    const ids = (prods ?? []).map((p) => p.id);
    if (ids.length) {
      const { data: pics } = await db.from("product_images").select("path").in("product_id", ids);
      await db.from("product_images").delete().in("product_id", ids);
      await db.from("product_variants").delete().in("product_id", ids);
      const { error } = await db.from("products").delete().in("id", ids);
      if (error) return { error: error.message };
      await removeFiles(db, (pics ?? []).map((p) => p.path));
    }
    const { error } = await db.from("categories").delete().in("id", removedIds);
    if (error) return { error: error.message };
  }

  const empty = (s: string) => s.trim() || null;
  // 1) add new / update existing (by slug); 2) compare groups, after every slug exists
  const { error } = await db.from("categories").upsert(
    rows.map((r, i) => ({ slug: r.slug.trim(), name_az: r.name_az.trim(), name_ru: empty(r.name_ru), name_en: empty(r.name_en), is_hidden: r.is_hidden, sort_order: i })),
    { onConflict: "slug" },
  );
  if (error) return { error: error.message };
  for (const r of rows) {
    const { error: e } = await db.from("categories").update({ compare_group: r.compare_group || null }).eq("slug", r.slug.trim());
    if (e) return { error: e.message };
  }
  revalidatePath("/", "layout");
  return { rows: await getCategoryRows(db) };
}
