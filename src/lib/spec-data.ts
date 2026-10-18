import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { pick } from "./i18n-field";
import type { SpecType } from "./specs";

// All spec types in the order set by sort_order. cache() = one query per request
export const getSpecTypes = cache(async (locale: string): Promise<SpecType[]> => {
  const db = await createClient();
  const { data, error } = await db.from("spec_types").select("key, label_az, label_ru, label_en").order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => ({ key: r.key, label: pick(r, "label", locale) }));
});
