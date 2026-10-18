import { createClient } from "@/lib/supabase/server";
import { pick } from "./i18n-field";

const BUCKET = "product-images";
export type CartLine = { id: string; slug: string; name: string; categoryName: string; variant: string; price: number; stock: number; image: string | null };

// Cart lines by variant id, in the order of the ids. Inactive variants and unpublished products are skipped.
export async function getCartLines(locale: string, ids: string[]): Promise<CartLine[]> {
  if (!ids.length) return [];
  const db = await createClient();
  const { data, error } = await db
    .from("product_variants")
    .select("id, sku, name_az, name_ru, name_en, price, stock, products!inner(slug, name_az, name_ru, name_en, is_published, categories(name_az, name_ru, name_en), product_images(path, sort_order, is_main, variant_id))")
    .in("id", ids)
    .eq("is_active", true)
    .eq("products.is_published", true);
  if (error) throw error;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const lines = (data ?? []).map((v: any): CartLine => {
    const p = v.products;
    const imgs = [...p.product_images].sort((a: any, b: any) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order);
    const img = imgs.find((i: any) => i.variant_id === v.id) ?? imgs.find((i: any) => !i.variant_id) ?? imgs[0];
    return {
      id: v.id, slug: p.slug, name: pick(p, "name", locale), categoryName: p.categories ? pick(p.categories, "name", locale) : "",
      variant: pick(v, "name", locale) || v.sku, price: Number(v.price), stock: v.stock,
      image: img ? db.storage.from(BUCKET).getPublicUrl(img.path).data.publicUrl : null,
    };
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return ids.flatMap((id) => lines.find((l) => l.id === id) ?? []);
}
