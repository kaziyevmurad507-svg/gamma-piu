// Spec types from the database: key (as used in products.specs) + label in the page language, in display order
export type SpecType = { key: string; label: string };

// Label of a spec key; unknown keys fall back to the key itself ("battery_life" -> "battery life")
export const specLabel = (types: SpecType[], key: string) => types.find((t) => t.key === key)?.label ?? key.replace(/_/g, " ");

// Known keys first (in database order), unknown keys after them (in the given order)
export const specOrder = (types: SpecType[], keys: string[]) => {
  const rank = (k: string) => { const i = types.findIndex((t) => t.key === k); return i < 0 ? types.length : i; };
  return [...keys].sort((a, b) => rank(a) - rank(b));
};
