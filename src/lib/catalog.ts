import { createClient } from "@/lib/supabase/server"; // ASSUMED path: change to your server client
import { colorOf, type Sort } from "./categories";
import { pick } from "./i18n-field";

export type Product = {
  id: string; slug: string; name: string; category: string; categoryName: string; group: string; color: string | null;
  price: number; stock: number; image: string | null; featured: boolean;
  variantId: string; specs: Record<string, unknown>; // cheapest variant (the one whose price the card shows)
};
export type Filters = { q?: string; cats?: string[]; min?: number; max?: number; avail?: string[]; colors?: string[]; sort?: Sort; ids?: string[] };

const BUCKET = "product-images"; // ASSUMED Storage bucket name (must be public)
const SELECT =
  "id, slug, name_az, name_ru, name_en, specs, is_featured, categories!inner(slug, name_az, name_ru, name_en, compare_group, is_hidden), product_variants(id, name_en, price, stock, is_active), product_images(path, sort_order, is_main, variant_id)";

// flag = only featured / only new products (used on the home page)
export async function getProducts(locale: string, f: Filters = {}, limit = 100, flag?: "is_featured" | "is_new") {
  const db = await createClient();
  let q = db.from("products").select(SELECT).eq("is_published", true).eq("categories.is_hidden", false).order("created_at", { ascending: false });
  if (flag) q = q.eq(flag, true);
  if (f.ids) q = q.in("id", f.ids);
  if (f.cats?.length) q = q.in("categories.slug", f.cats);
  const term = f.q?.replace(/[%,()]/g, " ").trim();
  if (term) q = q.or(["az", "ru", "en"].map((l) => `name_${l}.ilike.%${term}%`).join(","));
  const { data, error } = await q;
  if (error) throw error;

  // Price and stock live on variants, so we sum them up per product here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let list = (data ?? []).flatMap((r: any): Product[] => {
    const vs = r.product_variants.filter((v: { is_active: boolean }) => v.is_active);
    if (!vs.length) return []; // hide products without active variants
    // With a color filter, only variants of the chosen colors count (price, stock, photo)
    const want = f.colors ?? [];
    const pool = want.length ? vs.filter((v: { name_en: string }) => want.includes(colorOf(v.name_en) ?? "")) : vs;
    if (!pool.length) return [];
    const cheapest = pool.reduce((a: { price: number }, b: { price: number }) => (Number(b.price) < Number(a.price) ? b : a));
    const imgs = [...r.product_images].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order);
    // the card shows the photo of the variant whose price it shows
    const img = imgs.find((i) => i.variant_id === cheapest.id) ?? imgs.find((i) => !i.variant_id) ?? imgs[0];
    return [{
      id: r.id, variantId: cheapest.id, specs: r.specs ?? {}, slug: r.slug, name: r[`name_${locale}`] ?? r.name_az, category: r.categories.slug, categoryName: pick(r.categories, "name", locale), group: r.categories.compare_group ?? r.categories.slug,
      color: r.specs?.color ?? null,
      price: Math.min(...pool.map((v: { price: number }) => Number(v.price))), // "from" price
      stock: pool.reduce((n: number, v: { stock: number }) => n + v.stock, 0),
      image: img ? db.storage.from(BUCKET).getPublicUrl(img.path).data.publicUrl : null,
      featured: r.is_featured,
    }];
  });

  // Price and availability filters work after variants are merged
  if (f.min != null) list = list.filter((p) => p.price >= f.min!);
  if (f.max != null) list = list.filter((p) => p.price <= f.max!);
  // Only one availability box checked = filter. Both or none = show all.
  const inStock = f.avail?.includes("stock"), onOrder = f.avail?.includes("order");
  if (inStock && !onOrder) list = list.filter((p) => p.stock > 0);
  if (onOrder && !inStock) list = list.filter((p) => p.stock === 0);

  if (f.sort === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (f.sort === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (!f.sort || f.sort === "recommended") list.sort((a, b) => Number(b.featured) - Number(a.featured)); // stable: keeps newest first
  return list.slice(0, limit);
}

export const getFeatured = (locale: string) => getProducts(locale, {}, 4, "is_featured");
export const getNew = (locale: string) => getProducts(locale, {}, 4, "is_new");

// Products by id, in the order of the ids (used by favorites and compare)
export async function getProductsByIds(locale: string, ids: string[]) {
  if (!ids.length) return [];
  const list = await getProducts(locale, { ids }, 100);
  return ids.flatMap((id) => list.find((p) => p.id === id) ?? []);
}
