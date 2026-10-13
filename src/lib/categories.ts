// Fixed lists used by filters. Slugs must match your categories table.
export const CATEGORIES = ["clippers", "trimmers", "dryers", "scissors", "shavers", "blades", "accessories"] as const;
export const COLORS = ["black", "blue", "silver"] as const;
export const SORTS = ["recommended", "price-asc", "price-desc", "newest"] as const;
export type Sort = (typeof SORTS)[number];
