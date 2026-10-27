"use client";
// Favorites, compare and cart live in the browser (localStorage). Only ids are stored.
import { useSyncExternalStore } from "react";
import { CART_MAX_LINES, SAVED_MAX, clampQuantity, quantityLimit, reconcileCart, sanitizeCart, sanitizeIds, type SavedCartLine } from "./cart-policy";

export const COMPARE_MAX = 3;
type State = { fav: string[]; cmp: string[]; cmpGroup: string; cart: { id: string; qty: number }[] }; // fav/cmp = product ids, cart id = variant id
const EMPTY: State = { fav: [], cmp: [], cmpGroup: "", cart: [] };
const KEY = "gp-store";

let state = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    state = {
      fav: sanitizeIds(saved?.fav), cmp: sanitizeIds(saved?.cmp, COMPARE_MAX),
      cmpGroup: typeof saved?.cmpGroup === "string" ? saved.cmpGroup : "", cart: sanitizeCart(saved?.cart),
    };
    if (state.cmp.length && !state.cmpGroup) state = { ...state, cmp: [] }; // old data without a group
  } catch {
    state = EMPTY;
  }
}
function set(next: State) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {} // storage may be blocked, app still works
  subs.forEach((f) => f());
}
function subscribe(f: () => void) {
  subs.add(f);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { read(); f(); } }; // other tab changed it
  window.addEventListener("storage", onStorage);
  return () => { subs.delete(f); window.removeEventListener("storage", onStorage); };
}
const snapshot = () => { if (!loaded) { loaded = true; read(); } return state; };

// ready = false on the server and during hydration, so pages do not flash "empty"
export function useStore() {
  const s = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);
  return { ...s, ready };
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export const toggleFav = (id: string) => set({ ...state, fav: toggle(state.fav, id).slice(-SAVED_MAX) });
export const removeFav = (id: string) => set({ ...state, fav: state.fav.filter((x) => x !== id) });

// group = compare group of the product. "other" = list has another group (ask the user), "full" = 3 products already
export function toggleCompare(id: string, group: string): "ok" | "full" | "other" {
  if (state.cmp.includes(id)) { removeCompare(id); return "ok"; }
  if (state.cmp.length && state.cmpGroup !== group) return "other";
  if (state.cmp.length >= COMPARE_MAX) return "full";
  set({ ...state, cmp: [...state.cmp, id], cmpGroup: group });
  return "ok";
}
export const replaceCompare = (id: string, group: string) => set({ ...state, cmp: [id], cmpGroup: group });
export function removeCompare(id: string) {
  const cmp = state.cmp.filter((x) => x !== id);
  set({ ...state, cmp, cmpGroup: cmp.length ? state.cmpGroup : "" });
}

export function addToCart(id: string, qty: number, stock: number) {
  snapshot();
  const line = state.cart.find((l) => l.id === id);
  if (!line && state.cart.length >= CART_MAX_LINES) return false;
  const nextQty = clampQuantity((line?.qty ?? 0) + qty, quantityLimit(stock));
  if (line?.qty === nextQty) return false;
  const cart = line ? state.cart.map((l) => (l.id === id ? { ...l, qty: nextQty } : l)) : [...state.cart, { id, qty: nextQty }];
  set({ ...state, cart });
  window.dispatchEvent(new Event("gp:added")); // the toast listens to this
  return true;
}
// Put a removed cart line back (used by "Undo")
export const restoreLine = (id: string, qty: number, stock: number) => addToCart(id, qty, stock);
// Tells the toast that a line was removed and how to undo it
export const announceRemoved = (undo: () => void) => window.dispatchEvent(new CustomEvent("gp:removed", { detail: undo }));
export const addManyToCart = (lines: { variantId: string; stock: number }[]) => lines.forEach((line) => addToCart(line.variantId, 1, line.stock));
export const setQty = (id: string, qty: number, stock: number) => set({ ...state, cart: state.cart.map((l) => (l.id === id ? { ...l, qty: clampQuantity(qty, quantityLimit(stock)) } : l)) });
export function syncCart(available: { id: string; stock: number }[], requestedIds: string[]) {
  if (state.cart.map((line) => line.id).join(",") !== requestedIds.join(",")) return false;
  const cart = reconcileCart(state.cart, available).map(({ id, qty }) => ({ id, qty }));
  if (JSON.stringify(cart) === JSON.stringify(state.cart)) return false;
  set({ ...state, cart });
  return true;
}
// A second tab may change the cart while checkout is validating. Preserve that
// newer choice and require another review instead of overwriting it.
export function replaceValidatedCart(expected: SavedCartLine[], cart: SavedCartLine[]) {
  if (JSON.stringify(state.cart) !== JSON.stringify(expected)) return false;
  set({ ...state, cart: sanitizeCart(cart) });
  return true;
}
export const removeFromCart = (id: string) => set({ ...state, cart: state.cart.filter((l) => l.id !== id) });
