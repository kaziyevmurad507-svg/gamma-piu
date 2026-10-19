import type { SupabaseClient } from "@supabase/supabase-js";
import { BUCKET } from "./admin-storage";
import { pick } from "./i18n-field";
import { getStockStatus, type StockStatus } from "./stock";

export type AdminProduct = {
  id: string; name: string; category: string; categorySlug: string; variants: number; price: number | null; stock: number;
  status: StockStatus; image: string | null; published: boolean; skus: string[];
};

// All products for the admin (also unpublished ones), newest first. About 30 products, so we filter in code
export async function getAdminProducts(db: SupabaseClient): Promise<AdminProduct[]> {
  const { data, error } = await db
    .from("products")
    .select("id, name_az, name_ru, name_en, is_published, categories(slug, name_az, name_ru, name_en), product_variants(sku, price, stock, is_active), product_images(path, sort_order, is_main)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => {
    const vs = r.product_variants.filter((v: any) => v.is_active);
    const stock = vs.reduce((n: number, v: any) => n + v.stock, 0);
    const img = [...r.product_images].sort((a: any, b: any) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order)[0];
    return {
      id: r.id, name: pick(r, "name", "ru"), category: r.categories ? pick(r.categories, "name", "ru") : "—", categorySlug: r.categories?.slug ?? "",
      variants: vs.length, price: vs.length ? Math.min(...vs.map((v: any) => Number(v.price))) : null, stock,
      status: getStockStatus(stock), image: img ? db.storage.from(BUCKET).getPublicUrl(img.path).data.publicUrl : null,
      published: r.is_published, skus: r.product_variants.map((v: any) => String(v.sku).toLowerCase()),
    };
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

// ---- product form: data shape shared by the form (browser) and the save action (server). Numbers stay strings while typing
export type VariantFormData = { id: string; sku: string; name_az: string; name_ru: string; name_en: string; price: string; stock: string; is_active: boolean };
export type ProductFormData = {
  id: string | null; slug: string; category_id: string; brand_id: string;
  name_az: string; name_ru: string; name_en: string; description_az: string; description_ru: string; description_en: string;
  is_published: boolean; is_new: boolean; is_featured: boolean; variants: VariantFormData[];
};
export const emptyProduct: ProductFormData = {
  id: null, slug: "", category_id: "", brand_id: "", name_az: "", name_ru: "", name_en: "", description_az: "", description_ru: "", description_en: "",
  is_published: false, is_new: false, is_featured: false, variants: [],
};

const text = (v: unknown) => (typeof v === "string" ? v : "");

// One product with ALL its variants (also inactive), ready for the form
export async function getProductForm(db: SupabaseClient, id: string): Promise<ProductFormData | null> {
  const { data } = await db
    .from("products")
    .select("id, slug, category_id, brand_id, name_az, name_ru, name_en, description_az, description_ru, description_en, is_published, is_new, is_featured, product_variants(id, sku, name_az, name_ru, name_en, price, stock, is_active, sort_order)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const r = data as any;
  return {
    id: r.id, slug: r.slug, category_id: r.category_id ?? "", brand_id: r.brand_id ?? "",
    name_az: text(r.name_az), name_ru: text(r.name_ru), name_en: text(r.name_en),
    description_az: text(r.description_az), description_ru: text(r.description_ru), description_en: text(r.description_en),
    is_published: r.is_published, is_new: r.is_new, is_featured: r.is_featured,
    variants: [...r.product_variants].sort((a: any, b: any) => a.sort_order - b.sort_order).map((v: any) => ({
      id: v.id, sku: v.sku, name_az: text(v.name_az), name_ru: text(v.name_ru), name_en: text(v.name_en), price: String(v.price), stock: String(v.stock), is_active: v.is_active,
    })),
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

// Lists for the category / brand dropdowns
export async function getFormOptions(db: SupabaseClient) {
  const [c, b] = await Promise.all([db.from("categories").select("id, name_az, name_ru, name_en").order("sort_order"), db.from("brands").select("id, name").order("name")]);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return {
    categories: (c.data ?? []).map((r: any) => ({ value: r.id as string, label: pick(r, "name", "ru") })),
    brands: (b.data ?? []).map((r: any) => ({ value: r.id as string, label: r.name as string })),
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

// Photos of one product for the photo manager, in display order (variantId null = common photo)
export type AdminImage = { id: string; url: string; variantId: string | null; isMain: boolean };
export async function getProductImages(db: SupabaseClient, productId: string): Promise<AdminImage[]> {
  const { data } = await db.from("product_images").select("id, path, variant_id, is_main, sort_order").eq("product_id", productId).order("sort_order");
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((i: any) => ({ id: i.id, url: db.storage.from(BUCKET).getPublicUrl(i.path).data.publicUrl, variantId: i.variant_id, isMain: i.is_main }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
