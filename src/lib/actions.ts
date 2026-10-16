"use server";
// Server actions used by client pages (favorites, compare, cart) to load product data by id
import { getCartLines } from "./cart";
import { getProductsByIds } from "./catalog";

export async function loadProducts(locale: string, ids: string[]) {
  return getProductsByIds(locale, ids.slice(0, 50)); // slice = basic protection from huge requests
}

export async function loadCartLines(locale: string, ids: string[]) {
  return getCartLines(locale, ids.slice(0, 50));
}
