import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProducts } from "./catalog";
import { pick } from "./i18n-field";

const BUCKET = "product-images";

export type Variant = { id: string; sku: string; name: string; price: number; stock: number };
export type ProductDetail = {
  id: string; slug: string; name: string; description: string; brand: string | null; category: string;
  specs: Record<string, unknown>; variants: Variant[]; images: string[];
};

const SELECT =
  "id, slug, name_az, name_ru, name_en, description_az, description_ru, description_en, specs, categories(slug), brands(name), " +
  "product_variants(id, sku, name_az, name_ru, name_en, price, stock, is_active, sort_order), product_images(path, sort_order, is_main)";

// cache() lets the page and generateMetadata share one request
export const getProduct = cache(async (locale: string, slug: string): Promise<ProductDetail | null> => {
  const db = await createClient();
  const { data } = await db.from("products").select(SELECT).eq("slug", slug).eq("is_published", true).maybeSingle();
  if (!data) return null;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const r = data as any; // untyped client, so we describe the shape by hand
  const variants: Variant[] = r.product_variants
    .filter((v: any) => v.is_active)
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((v: any) => ({ id: v.id, sku: v.sku, name: pick(v, "name", locale) || v.sku, price: Number(v.price), stock: v.stock }));
  if (!variants.length) return null; // nothing to sell
  const images: string[] = [...r.product_images]
    .sort((a: any, b: any) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order)
    .map((i: any) => db.storage.from(BUCKET).getPublicUrl(i.path).data.publicUrl);
  return {
    id: r.id, slug: r.slug, name: pick(r, "name", locale), description: pick(r, "description", locale),
    brand: r.brands?.name ?? null, category: r.categories?.slug ?? "",
    specs: r.specs ?? {}, variants, images,
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
});

// "Complete your kit": 4 other products, different categories first
export async function getRelated(locale: string, currentId: string) {
  const list = (await getProducts(locale, {}, 50)).filter((p) => p.id !== currentId);
  const seen = new Set<string>();
  const out = list.filter((p) => !seen.has(p.category) && seen.add(p.category));
  for (const p of list) if (out.length < 4 && !out.includes(p)) out.push(p);
  return out.slice(0, 4);
}
