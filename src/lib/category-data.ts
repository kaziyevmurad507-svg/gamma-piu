import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { pick } from "./i18n-field";
import type { Category } from "./categories";

// Public categories only. Admin readers use their authenticated client separately.
export const getCategories = cache(async (locale: string): Promise<Category[]> => {
  const db = createPublicClient();
  const { data, error } = await db.from("categories").select("slug, name_az, name_ru, name_en, compare_group, is_hidden").eq("is_hidden", false).order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => ({ slug: r.slug, name: pick(r, "name", locale), group: r.compare_group ?? r.slug, hidden: r.is_hidden }));
});
