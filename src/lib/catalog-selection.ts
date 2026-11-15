import { colorOf } from "./categories";

export type CatalogVariant = { id: string; name_en: string | null; price: number; stock: number; is_active: boolean };
type CatalogImage = { variant_id: string | null; is_main: boolean; sort_order: number };

// One variant owns every card fact: price, stock, image and cart button.
// The starred photo chooses the variant, within explicit color/availability filters.
// Without an eligible starred variant, prefer an available variant.
export function selectCatalogVariant(variants: CatalogVariant[], colors: string[] = [], availability: string[] = [], images: CatalogImage[] = []) {
  const stockOnly = availability.includes("stock") && !availability.includes("order");
  const orderOnly = availability.includes("order") && !availability.includes("stock");
  const pool = variants.filter((v) => v.is_active && Number.isFinite(Number(v.price))
    && (!colors.length || colors.includes(colorOf(v.name_en) ?? ""))
    && (!stockOnly || v.stock > 0) && (!orderOnly || v.stock <= 0));
  const main = images.find((image) => image.is_main);
  const preferred = pool.find((v) => v.id === main?.variant_id);
  if (preferred) return preferred;
  const available = pool.filter((v) => v.stock > 0);
  return [...(available.length ? available : pool)].sort((a, b) => Number(a.price) - Number(b.price) || a.id.localeCompare(b.id))[0];
}

export function selectVariantImage<T extends CatalogImage>(images: T[], variantId: string) {
  const ordered = [...images].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order);
  return ordered.find((image) => image.is_main && (!image.variant_id || image.variant_id === variantId))
    ?? ordered.find((image) => image.variant_id === variantId) ?? ordered.find((image) => !image.variant_id);
}
