"use server";
import { z } from "zod";
import { getCartLines } from "./cart";
import { getProductsByIds } from "./catalog";
import { CART_MAX_LINES, SAVED_MAX, reconcileCart } from "./cart-policy";

const localeSchema = z.enum(["az", "ru", "en"]);
const idsSchema = z.array(z.uuid()).max(SAVED_MAX);
export async function loadProducts(locale: string, ids: string[]) {
  return getProductsByIds(localeSchema.parse(locale), [...new Set(idsSchema.parse(ids))]);
}
export async function loadCartLines(locale: string, ids: string[]) {
  return getCartLines(localeSchema.parse(locale), [...new Set(idsSchema.max(CART_MAX_LINES).parse(ids))]);
}
export async function validateCart(locale: string, cart: { id: string; qty: number }[]) {
  const saved = z.array(z.object({ id: z.uuid(), qty: z.number().int().positive().max(9999) })).max(CART_MAX_LINES).parse(cart);
  const unique = [...new Map(saved.map((line) => [line.id, line])).values()];
  return reconcileCart(unique, await loadCartLines(locale, unique.map((line) => line.id)));
}
