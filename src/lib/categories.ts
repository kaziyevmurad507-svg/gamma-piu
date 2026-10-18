// Filter colors. Each one lists the variant names (English, lowercase, dashes) that belong to it, e.g. "Golden rose" -> golden-rose
export const COLOR_GROUPS = {
  black: ["black", "black-matt"], grey: ["grey"], silver: ["silver"], gold: ["gold"], rose: ["golden-rose"],
  pink: ["pink"], red: ["red"], violet: ["violet", "lilac"], blue: ["blue", "light-blue", "blue-avio", "teal"],
  green: ["green", "matcha-green"], orange: ["orange"],
} as const;
export const COLORS = Object.keys(COLOR_GROUPS) as (keyof typeof COLOR_GROUPS)[];
// Filter color of a variant, taken from its English name (undefined = not in any filter)
export const colorOf = (nameEn?: string | null) => {
  const s = (nameEn ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return COLORS.find((c) => (COLOR_GROUPS[c] as readonly string[]).includes(s));
};
export const SORTS = ["recommended", "price-asc", "price-desc", "newest"] as const;
export type Sort = (typeof SORTS)[number];

// Category from the database. group = compare group: products are compared only inside one group.
// A category with compare_group set (e.g. accessories -> blades) joins the group of that other category.
export type Category = { slug: string; name: string; group: string; hidden: boolean };
export const groupName = (list: Category[], group: string) => list.find((c) => c.slug === group)?.name ?? group;
export const groupSlugs = (list: Category[], group: string) => list.filter((c) => c.group === group).map((c) => c.slug);
