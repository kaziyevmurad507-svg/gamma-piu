"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { removeFiles } from "@/lib/admin-storage";
import type { ProductFormData } from "@/lib/admin-data";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const dbError = (e: { code?: string; message: string }) => (e.code === "23505" ? "Такой SKU или адрес (slug) уже используется" : e.message);

// Returns the first problem as text, or null when everything is fine
function validate(d: ProductFormData) {
  if (!d.name_az.trim()) return "Введите название (AZ)";
  if (!d.category_id) return "Выберите категорию";
  if (!d.id && !SLUG.test(d.slug.trim())) return "Адрес (slug): только маленькие латинские буквы, цифры и дефис";
  const keys = new Set<string>();
  for (const r of d.specs) {
    const key = r.key.trim();
    if (!key) { if (r.az.trim() || r.ru.trim() || r.en.trim()) return "У характеристики не выбран тип"; continue; }
    if (keys.has(key)) return `Характеристика «${key}» указана дважды`;
    keys.add(key);
  }
  const skus = new Set<string>();
  for (const v of d.variants) {
    const sku = v.sku.trim().toLowerCase();
    if (!sku) return "У каждого варианта должен быть SKU";
    if (skus.has(sku)) return `SKU «${v.sku.trim()}» повторяется`;
    skus.add(sku);
    if (v.price.trim() === "" || !(Number(v.price) >= 0)) return `Вариант ${v.sku}: неверная цена`;
    if (!/^\d+$/.test(v.stock.trim())) return `Вариант ${v.sku}: склад — целое число от 0`;
  }
  return null;
}

// Creates or updates a product with its variants and specs. Photos are not touched here
export async function saveProduct(d: ProductFormData): Promise<{ error: string } | { id: string }> {
  const { db } = await requireAdmin();
  const problem = validate(d);
  if (problem) return { error: problem };

  // specs object: plain text when ru/en are empty, otherwise { az, ru, en } without the empty ones
  const specs: Record<string, unknown> = {};
  for (const r of d.specs) {
    const v = { az: r.az.trim(), ru: r.ru.trim(), en: r.en.trim() };
    if (!r.key.trim() || !(v.az || v.ru || v.en)) continue;
    specs[r.key.trim()] = !v.ru && !v.en ? v.az : Object.fromEntries(Object.entries(v).filter(([, s]) => s));
  }
  const empty = (s: string) => s.trim() || null; // optional text: empty -> NULL
  const row = {
    category_id: d.category_id, brand_id: d.brand_id || null,
    name_az: d.name_az.trim(), name_ru: empty(d.name_ru), name_en: empty(d.name_en),
    description_az: empty(d.description_az), description_ru: empty(d.description_ru), description_en: empty(d.description_en),
    is_published: d.is_published, is_new: d.is_new, is_featured: d.is_featured, specs,
  };
  const id = d.id ?? crypto.randomUUID();
  const { error } = d.id ? await db.from("products").update(row).eq("id", id) : await db.from("products").insert({ ...row, id, slug: d.slug.trim() });
  if (error) return { error: dbError(error) };

  if (d.id) {
    // variants removed in the form are deleted
    const { data: old } = await db.from("product_variants").select("id").eq("product_id", id);
    const kept = d.variants.map((v) => v.id);
    const gone = (old ?? []).map((v) => v.id).filter((x) => !kept.includes(x));
    if (gone.length) {
      const { data: pics } = await db.from("product_images").select("path").in("variant_id", gone);
      await db.from("product_variants").delete().in("id", gone); // their photo records go with them
      await removeFiles(db, (pics ?? []).map((p) => p.path));
    }
  }
  const { error: ve } = await db.from("product_variants").upsert(
    d.variants.map((v, i) => ({
      id: v.id, product_id: id, sku: v.sku.trim(), name_az: empty(v.name_az), name_ru: empty(v.name_ru), name_en: empty(v.name_en),
      price: Number(v.price), stock: Number(v.stock), is_active: v.is_active, sort_order: i,
    })),
    { onConflict: "id" },
  );
  if (ve) {
    if (!d.id) await db.from("products").delete().eq("id", id); // new product: undo, nothing half-saved
    return { error: dbError(ve) };
  }
  revalidatePath("/", "layout");
  return { id };
}

// Removes the product, its variants, photo records and photo files
export async function deleteProduct(id: string) {
  const { db } = await requireAdmin();
  const { data: pics } = await db.from("product_images").select("path").eq("product_id", id);
  await db.from("product_images").delete().eq("product_id", id);
  await db.from("product_variants").delete().eq("product_id", id);
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) throw new Error(dbError(error));
  await removeFiles(db, (pics ?? []).map((p) => p.path));
  revalidatePath("/", "layout");
  redirect("/admin/products");
}
