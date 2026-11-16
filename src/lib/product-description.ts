import type { ProductDetail } from "./product";

// Use the same factual description in visible content, metadata and JSON-LD.
// A missing editorial description must not erase the product's known identity.
export function productDescription(product: Pick<ProductDetail, "description" | "name" | "categoryName">): string {
  return product.description.trim() || [product.name, product.categoryName].filter(Boolean).join(" · ");
}
