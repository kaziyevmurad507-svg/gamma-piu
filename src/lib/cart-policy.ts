export const PREORDER_MAX = 10;
export const CART_MAX_LINES = 100;
export const SAVED_MAX = 500;
export type SavedCartLine = { id: string; qty: number };

export const quantityLimit = (stock: number) => stock > 0 ? Math.min(9999, Math.floor(stock)) : PREORDER_MAX;
export const clampQuantity = (qty: number, max: number) => Math.max(1, Math.min(Number.isFinite(qty) ? Math.floor(qty) : 1, Math.max(1, max)));

// localStorage is user-controlled and can contain data from older app versions.
export function sanitizeIds(value: unknown, max = SAVED_MAX): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)))].slice(0, max) : [];
}

export function sanitizeCart(value: unknown): SavedCartLine[] {
  if (!Array.isArray(value)) return [];
  const lines = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item !== "object" || !sanitizeIds([item.id], 1).length) continue;
    lines.set(item.id, clampQuantity((lines.get(item.id) ?? 0) + Number(item.qty), 9999));
    if (lines.size >= CART_MAX_LINES) break;
  }
  return [...lines].map(([id, qty]) => ({ id, qty }));
}

export function reconcileCart<T extends { id: string; stock: number }>(saved: SavedCartLine[], available: T[]) {
  return saved.flatMap((line) => {
    const current = available.find((row) => row.id === line.id);
    return current ? [{ ...current, qty: clampQuantity(line.qty, quantityLimit(current.stock)) }] : [];
  });
}
