import { colorOf } from "./categories";

export type CatalogVariant = { id: string; name_en: string | null; price: number; stock: number; is_active: boolean };

// One variant owns every card fact: price, stock, image and cart button.
// Prefer an available variant; explicit preorder filters select preorder variants.
export function selectCatalogVariant(variants: CatalogVariant[], colors: string[] = [], availability: string[] = []) {
  const stockOnly = availability.includes("stock") && !availability.includes("order");
  const orderOnly = availability.includes("order") && !availability.includes("stock");
  const pool = variants.filter((v) => v.is_active && Number.isFinite(Number(v.price))
    && (!colors.length || colors.includes(colorOf(v.name_en) ?? ""))
    && (!stockOnly || v.stock > 0) && (!orderOnly || v.stock <= 0));
  const available = pool.filter((v) => v.stock > 0);
  return [...(available.length ? available : pool)].sort((a, b) => Number(a.price) - Number(b.price) || a.id.localeCompare(b.id))[0];
}

export function selectVariantImage<T extends { variant_id: string | null; is_main: boolean; sort_order: number }>(images: T[], variantId: string) {
  const ordered = [...images].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order);
  return ordered.find((image) => image.variant_id === variantId) ?? ordered.find((image) => !image.variant_id);
}
