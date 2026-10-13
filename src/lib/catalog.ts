import { createClient } from "@/lib/supabase/server"; // ASSUMED path: change to your server client
import type { Sort } from "./categories";

export type Product = {
  id: string; slug: string; name: string; category: string; color: string | null;
  price: number; stock: number; image: string | null; featured: boolean;
};
export type Filters = { q?: string; cats?: string[]; min?: number; max?: number; avail?: string[]; colors?: string[]; sort?: Sort };

const BUCKET = "product-images"; // ASSUMED Storage bucket name (must be public)
const SELECT =
  "id, slug, name_az, name_ru, name_en, specs, is_featured, categories!inner(slug), product_variants(price, stock, is_active), product_images(path, sort_order, is_main)";

// flag = only featured / only new products (used on the home page)
export async function getProducts(locale: string, f: Filters = {}, limit = 100, flag?: "is_featured" | "is_new") {
  const db = await createClient();
  let q = db.from("products").select(SELECT).eq("is_published", true).order("created_at", { ascending: false });
  if (flag) q = q.eq(flag, true);
  if (f.cats?.length) q = q.in("categories.slug", f.cats);
  if (f.colors?.length) q = q.in("specs->>color", f.colors); // ASSUMED: color is stored as specs.color
  const term = f.q?.replace(/[%,()]/g, " ").trim();
  if (term) q = q.or(["az", "ru", "en"].map((l) => `name_${l}.ilike.%${term}%`).join(","));
  const { data, error } = await q;
  if (error) throw error;

  // Price and stock live on variants, so we sum them up per product here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let list = (data ?? []).flatMap((r: any): Product[] => {
    const vs = r.product_variants.filter((v: { is_active: boolean }) => v.is_active);
    if (!vs.length) return []; // hide products without active variants
    const img = [...r.product_images].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order)[0];
    return [{
      id: r.id, slug: r.slug, name: r[`name_${locale}`] ?? r.name_az, category: r.categories.slug,
      color: r.specs?.color ?? null,
      price: Math.min(...vs.map((v: { price: number }) => Number(v.price))), // "from" price
      stock: vs.reduce((n: number, v: { stock: number }) => n + v.stock, 0),
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
