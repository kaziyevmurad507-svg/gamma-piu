import type { SupabaseClient } from "@supabase/supabase-js";
import { pick } from "./i18n-field";
import { getStockStatus, type StockStatus } from "./stock";

const BUCKET = "product-images";
export type AdminProduct = {
  id: string; name: string; category: string; variants: number; price: number | null; stock: number;
  status: StockStatus; image: string | null; published: boolean; skus: string[];
};

// All products for the admin (also unpublished ones), newest first. About 30 products, so we filter in code
export async function getAdminProducts(db: SupabaseClient): Promise<AdminProduct[]> {
  const { data, error } = await db
    .from("products")
    .select("id, name_az, name_ru, name_en, is_published, categories(name_az, name_ru, name_en), product_variants(sku, price, stock, is_active), product_images(path, sort_order, is_main)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => {
    const vs = r.product_variants.filter((v: any) => v.is_active);
    const stock = vs.reduce((n: number, v: any) => n + v.stock, 0);
    const img = [...r.product_images].sort((a: any, b: any) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order)[0];
    return {
      id: r.id, name: pick(r, "name", "ru"), category: r.categories ? pick(r.categories, "name", "ru") : "—",
      variants: vs.length, price: vs.length ? Math.min(...vs.map((v: any) => Number(v.price))) : null, stock,
      status: getStockStatus(stock), image: img ? db.storage.from(BUCKET).getPublicUrl(img.path).data.publicUrl : null,
      published: r.is_published, skus: r.product_variants.map((v: any) => String(v.sku).toLowerCase()),
    };
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
