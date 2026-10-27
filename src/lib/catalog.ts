import { createPublicClient } from "@/lib/supabase/public";
import { colorOf, type Sort } from "./categories";
import { selectCatalogVariant, selectVariantImage, type CatalogVariant } from "./catalog-selection";
import { pick } from "./i18n-field";

export type Product = {
  id: string; slug: string; name: string; category: string; categoryName: string; group: string; color: string | null;
  price: number; stock: number; image: string | null; featured: boolean;
  variantId: string; specs: Record<string, unknown>;
};
export type Filters = { q?: string; cats?: string[]; min?: number; max?: number; avail?: string[]; colors?: string[]; sort?: Sort; ids?: string[] };
export const CATALOG_PAGE_SIZE = 24;
const BATCH_SIZE = 200;
const BUCKET = "product-images";
type IndexRow = { id: string; is_featured: boolean; categories: { slug: string }; product_variants: CatalogVariant[] };
type Selected = { id: string; featured: boolean; category: string; variant: CatalogVariant };
type Translations = { name_az: string; name_ru: string | null; name_en: string | null };
type CardRow = Translations & {
  id: string; slug: string; specs?: Record<string, unknown>;
  categories: Translations & { slug: string; compare_group: string | null };
  product_images: { path: string; sort_order: number; is_main: boolean; variant_id: string | null }[];
};

// Only the small pricing index is scanned. Descriptions, specs and image lists are
// fetched for the visible page, and explicit ranges avoid the API's row limit.
async function getIndex(f: Filters = {}, flag?: "is_featured" | "is_new"): Promise<Selected[]> {
  if (f.ids && !f.ids.length) return [];
  const db = createPublicClient();
  const rows: IndexRow[] = [];
  for (let offset = 0; ; offset += BATCH_SIZE) {
    let query = db.from("products")
      .select("id, is_featured, categories!inner(slug,is_hidden), product_variants(id,name_en,price,stock,is_active)")
      .eq("is_published", true).eq("categories.is_hidden", false)
      .order("created_at", { ascending: false }).order("id")
      .range(offset, offset + BATCH_SIZE - 1);
    if (flag) query = query.eq(flag, true);
    if (f.ids) query = query.in("id", f.ids);
    if (f.cats?.length) query = query.in("categories.slug", f.cats);
    const term = f.q?.replace(/[%,()]/g, " ").trim().slice(0, 80);
    if (term) query = query.or(["az", "ru", "en"].map((lang) => `name_${lang}.ilike.%${term}%`).join(","));
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data ?? []) as unknown as IndexRow[]);
    if (!data || data.length < BATCH_SIZE) break;
  }
  const list = rows.flatMap((row): Selected[] => {
    const variant = selectCatalogVariant(row.product_variants, f.colors, f.avail);
    if (!variant || (f.min != null && Number(variant.price) < f.min) || (f.max != null && Number(variant.price) > f.max)) return [];
    return [{ id: row.id, featured: row.is_featured, category: row.categories.slug, variant }];
  });
  if (f.sort === "price-asc") list.sort((a, b) => Number(a.variant.price) - Number(b.variant.price));
  else if (f.sort === "price-desc") list.sort((a, b) => Number(b.variant.price) - Number(a.variant.price));
  else if (!f.sort || f.sort === "recommended") list.sort((a, b) => Number(b.featured) - Number(a.featured));
  return list;
}

async function loadCards(locale: string, selected: Selected[], includeSpecs = false): Promise<Product[]> {
  if (!selected.length) return [];
  const db = createPublicClient();
  const rows: CardRow[] = [];
  for (let offset = 0; offset < selected.length; offset += 50) {
    const { data, error } = await db.from("products")
      .select(`id,slug,name_az,name_ru,name_en,${includeSpecs ? "specs," : ""}categories!inner(slug,name_az,name_ru,name_en,compare_group,is_hidden),product_images(path,sort_order,is_main,variant_id)`)
      .eq("is_published", true).eq("categories.is_hidden", false)
      .in("id", selected.slice(offset, offset + 50).map((row) => row.id));
    if (error) throw error;
    rows.push(...(data ?? []) as unknown as CardRow[]);
  }
  return selected.flatMap(({ id, featured, variant }): Product[] => {
    const row = rows.find((candidate) => candidate.id === id);
    if (!row) return [];
    const image = selectVariantImage(row.product_images, variant.id);
    return [{
      id, slug: row.slug, name: pick(row, "name", locale), category: row.categories.slug,
      categoryName: pick(row.categories, "name", locale), group: row.categories.compare_group ?? row.categories.slug,
      variantId: variant.id, color: colorOf(variant.name_en) ?? null, price: Number(variant.price), stock: Math.max(0, variant.stock),
      image: image ? db.storage.from(BUCKET).getPublicUrl(image.path).data.publicUrl : null,
      featured, specs: row.specs ?? {},
    }];
  });
}

export async function getCatalogPage(locale: string, filters: Filters = {}, requestedPage = 1) {
  const index = await getIndex(filters);
  const pages = Math.max(1, Math.ceil(index.length / CATALOG_PAGE_SIZE));
  const page = Math.max(1, Math.min(Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1, pages));
  return { products: await loadCards(locale, index.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE)), total: index.length, page, pages };
}

export async function getProducts(locale: string, filters: Filters = {}, limit?: number, flag?: "is_featured" | "is_new") {
  const index = await getIndex(filters, flag);
  return loadCards(locale, limit == null ? index : index.slice(0, limit));
}
export const getFeatured = (locale: string) => getProducts(locale, {}, 4, "is_featured");
export const getNew = (locale: string) => getProducts(locale, {}, 4, "is_new");

export async function getRelatedProducts(locale: string, currentId: string) {
  const index = (await getIndex()).filter((product) => product.id !== currentId);
  const selected: Selected[] = [];
  const categories = new Set<string>();
  for (const product of index) {
    if (!categories.has(product.category)) {
      selected.push(product);
      categories.add(product.category);
    }
    if (selected.length === 4) break;
  }
  for (const product of index) {
    if (selected.length === 4) break;
    if (!selected.includes(product)) selected.push(product);
  }
  return loadCards(locale, selected);
}

export async function getProductsByIds(locale: string, ids: string[]) {
  const index: Selected[] = [];
  for (let offset = 0; offset < ids.length; offset += 50) index.push(...await getIndex({ ids: ids.slice(offset, offset + 50) }));
  const list = await loadCards(locale, index, true);
  return ids.flatMap((id) => list.find((product) => product.id === id) ?? []);
}
