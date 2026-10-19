"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import type { SpecTypeRow } from "@/lib/admin-data";

// Saves the whole list: new rows are added, existing ones renamed/reordered, rows removed in the form are deleted
export async function saveSpecTypes(rows: SpecTypeRow[]): Promise<{ error?: string }> {
  const { db } = await requireAdmin();
  const keys = new Set<string>();
  for (const r of rows) {
    const key = r.key.trim();
    if (!/^[a-z0-9_]+$/.test(key)) return { error: `Ключ «${key}»: только маленькие латинские буквы, цифры и _` };
    if (keys.has(key)) return { error: `Ключ «${key}» повторяется` };
    keys.add(key);
    if (!r.label_az.trim()) return { error: `«${key}»: введите название (AZ)` };
  }
  const { data: old } = await db.from("spec_types").select("key");
  const gone = (old ?? []).map((o) => o.key).filter((k) => !keys.has(k));
  if (gone.length) {
    const { error } = await db.from("spec_types").delete().in("key", gone);
    if (error) return { error: error.message };
  }
  const empty = (s: string) => s.trim() || null;
  const { error } = await db.from("spec_types").upsert(
    rows.map((r, i) => ({ key: r.key.trim(), label_az: r.label_az.trim(), label_ru: empty(r.label_ru), label_en: empty(r.label_en), sort_order: i })),
    { onConflict: "key" },
  );
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}
