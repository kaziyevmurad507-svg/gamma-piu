import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { pick } from "./i18n-field";
import type { Category } from "./categories";

// All categories (hidden ones too, flagged), in the order set by sort_order. cache() = one query per request
export const getCategories = cache(async (locale: string): Promise<Category[]> => {
  const db = await createClient();
  const { data, error } = await db.from("categories").select("slug, name_az, name_ru, name_en, compare_group, is_hidden").order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => ({ slug: r.slug, name: pick(r, "name", locale), group: r.compare_group ?? r.slug, hidden: r.is_hidden }));
});
