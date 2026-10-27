import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { getRelatedProducts } from "./catalog";
import { pick } from "./i18n-field";
import { colorOf } from "./categories";

const BUCKET = "product-images";

export type Variant = { id: string; sku: string; name: string; price: number; stock: number; color: string | null };
// variantId = null: common photo; otherwise the photo belongs to that variant (color) only
export type ProductImage = { url: string; variantId: string | null };
export type ProductDetail = {
  id: string; slug: string; name: string; description: string; brand: string | null; category: string; categoryName: string; group: string;
  specs: Record<string, unknown>; variants: Variant[]; images: ProductImage[];
};

const SELECT =
  "id, slug, name_az, name_ru, name_en, description_az, description_ru, description_en, specs, categories!inner(slug, name_az, name_ru, name_en, compare_group, is_hidden), brands(name), " +
  "product_variants(id, sku, name_az, name_ru, name_en, price, stock, is_active, sort_order), product_images(path, sort_order, is_main, variant_id)";

// cache() lets the page and generateMetadata share one request
export const getProduct = cache(async (locale: string, slug: string): Promise<ProductDetail | null> => {
  const db = createPublicClient();
  const { data, error } = await db.from("products").select(SELECT).eq("slug", slug).eq("is_published", true).eq("categories.is_hidden", false).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const r = data as any; // untyped client, so we describe the shape by hand
  const variants: Variant[] = r.product_variants
    .filter((v: any) => v.is_active)
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((v: any) => ({ id: v.id, sku: v.sku, name: pick(v, "name", locale) || v.sku, price: Number(v.price), stock: Math.max(0, v.stock), color: colorOf(v.name_en) ? v.name_en : null }));
  if (!variants.length) return null; // nothing to sell
  const images: ProductImage[] = [...r.product_images]
    .sort((a: any, b: any) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order)
    .map((i: any) => ({ url: db.storage.from(BUCKET).getPublicUrl(i.path).data.publicUrl, variantId: i.variant_id ?? null }));
  return {
    id: r.id, slug: r.slug, name: pick(r, "name", locale), description: pick(r, "description", locale),
    brand: r.brands?.name ?? null, category: r.categories?.slug ?? "", categoryName: r.categories ? pick(r.categories, "name", locale) : "", group: r.categories?.compare_group ?? r.categories?.slug ?? "",
    specs: r.specs ?? {}, variants, images,
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
});

// "Complete your kit": 4 other products, different categories first
export async function getRelated(locale: string, currentId: string) {
  return getRelatedProducts(locale, currentId);
}
