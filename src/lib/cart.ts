import { createPublicClient } from "@/lib/supabase/public";
import { selectVariantImage } from "./catalog-selection";
import { pick } from "./i18n-field";

const BUCKET = "product-images";
export type CartLine = { id: string; slug: string; name: string; categoryName: string; variant: string; price: number; stock: number; image: string | null };
type Names = { name_az: string; name_ru: string | null; name_en: string | null };
type Row = Names & { id: string; sku: string; price: number; stock: number; products: Names & {
  slug: string; categories: Names;
  product_images: { path: string; sort_order: number; is_main: boolean; variant_id: string | null }[];
} };

// Always fresh: never send a hidden, inactive or stale-price line to WhatsApp.
export async function getCartLines(locale: string, ids: string[]): Promise<CartLine[]> {
  if (!ids.length) return [];
  const db = createPublicClient({ fresh: true });
  const rows: Row[] = [];
  for (let offset = 0; offset < ids.length; offset += 50) {
    const { data, error } = await db.from("product_variants")
      .select("id,sku,name_az,name_ru,name_en,price,stock,products!inner(slug,name_az,name_ru,name_en,is_published,categories!inner(name_az,name_ru,name_en,is_hidden),product_images(path,sort_order,is_main,variant_id))")
      .in("id", ids.slice(offset, offset + 50)).eq("is_active", true)
      .eq("products.is_published", true).eq("products.categories.is_hidden", false);
    if (error) throw error;
    rows.push(...(data ?? []) as unknown as Row[]);
  }
  const lines = rows.map((variant): CartLine => {
    const product = variant.products;
    const image = selectVariantImage(product.product_images, variant.id);
    return {
      id: variant.id, slug: product.slug, name: pick(product, "name", locale), categoryName: pick(product.categories, "name", locale),
      variant: pick(variant, "name", locale) || variant.sku, price: Number(variant.price), stock: Math.max(0, variant.stock),
      image: image ? db.storage.from(BUCKET).getPublicUrl(image.path).data.publicUrl : null,
    };
  });
  return ids.flatMap((id) => lines.find((line) => line.id === id) ?? []);
}
