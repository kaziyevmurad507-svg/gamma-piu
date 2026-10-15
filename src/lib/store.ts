"use client";
// Favorites, compare and cart live in the browser (localStorage). Only ids are stored.
import { useSyncExternalStore } from "react";

export const COMPARE_MAX = 3;
type State = { fav: string[]; cmp: string[]; cart: { id: string; qty: number }[] }; // fav/cmp = product ids, cart id = variant id
const EMPTY: State = { fav: [], cmp: [], cart: [] };
const KEY = "gp-store";

let state = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

function read() {
  try {
    state = { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
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

// Returns false when the compare list is full
export function toggleCompare(id: string) {
  if (!state.cmp.includes(id) && state.cmp.length >= COMPARE_MAX) return false;
  set({ ...state, cmp: toggle(state.cmp, id) });
  return true;
}
export const removeCompare = (id: string) => set({ ...state, cmp: state.cmp.filter((x) => x !== id) });

export function addToCart(id: string, qty = 1) {
  const line = state.cart.find((l) => l.id === id);
  const cart = line ? state.cart.map((l) => (l.id === id ? { ...l, qty: Math.min(l.qty + qty, 99) } : l)) : [...state.cart, { id, qty }];
  set({ ...state, cart });
}
export const addManyToCart = (ids: string[]) => ids.forEach((id) => addToCart(id));
export const setQty = (id: string, qty: number) => set({ ...state, cart: state.cart.map((l) => (l.id === id ? { ...l, qty } : l)) });
export const removeFromCart = (id: string) => set({ ...state, cart: state.cart.filter((l) => l.id !== id) });
