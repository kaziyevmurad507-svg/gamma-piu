"use client";
// Favorites, compare and cart live in the browser (localStorage). Only ids are stored.
import { useSyncExternalStore } from "react";

export const COMPARE_MAX = 3;
type State = { fav: string[]; cmp: string[]; cmpGroup: string; cart: { id: string; qty: number }[] }; // fav/cmp = product ids, cart id = variant id
const EMPTY: State = { fav: [], cmp: [], cmpGroup: "", cart: [] };
const KEY = "gp-store";

let state = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

function read() {
  try {
    state = { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
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

export const toggleFav = (id: string) => set({ ...state, fav: toggle(state.fav, id) });
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

export function addToCart(id: string, qty = 1) {
  const line = state.cart.find((l) => l.id === id);
  const cart = line ? state.cart.map((l) => (l.id === id ? { ...l, qty: Math.min(l.qty + qty, 99) } : l)) : [...state.cart, { id, qty }];
  set({ ...state, cart });
  window.dispatchEvent(new Event("gp:added")); // the toast listens to this
}
// Put a removed cart line back (used by "Undo")
export const restoreLine = (id: string, qty: number) => set({ ...state, cart: [...state.cart, { id, qty }] });
// Tells the toast that a line was removed and how to undo it
export const announceRemoved = (undo: () => void) => window.dispatchEvent(new CustomEvent("gp:removed", { detail: undo }));
export const addManyToCart = (ids: string[]) => ids.forEach((id) => addToCart(id));
export const setQty = (id: string, qty: number) => set({ ...state, cart: state.cart.map((l) => (l.id === id ? { ...l, qty } : l)) });
export const removeFromCart = (id: string) => set({ ...state, cart: state.cart.filter((l) => l.id !== id) });
