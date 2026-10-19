"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { removeFiles } from "@/lib/admin-storage";

const done = () => revalidatePath("/", "layout");

// Saves records for files the browser has already uploaded. The first photo of a product becomes the main one
export async function addImages(productId: string, items: { path: string; variantId: string | null }[]): Promise<{ error?: string }> {
  const { db } = await requireAdmin();
  const { data: p } = await db.from("products").select("slug").eq("id", productId).maybeSingle();
  if (!p || items.some((i) => !i.path.startsWith(`${p.slug}/`))) return { error: "Неверные данные фото" };
  const { data: all } = await db.from("product_images").select("sort_order, is_main").eq("product_id", productId);
  let next = Math.max(0, ...(all ?? []).map((i) => i.sort_order)) + 1;
  const noMain = !(all ?? []).some((i) => i.is_main);
  const { error } = await db.from("product_images").insert(
    items.map((i, n) => ({ product_id: productId, variant_id: i.variantId, path: i.path, sort_order: next++, is_main: noMain && n === 0 })),
  );
  if (error) return { error: error.message };
  done();
  return {};
}

type Result = { error?: string };
const NOTHING = "Не получилось: нет прав или фото уже удалено. Обновите страницу и войдите заново";

// Exactly one main photo per product
export async function setMainImage(productId: string, imageId: string): Promise<Result> {
  const { db } = await requireAdmin();
  const off = await db.from("product_images").update({ is_main: false }).eq("product_id", productId).neq("id", imageId);
  if (off.error) return { error: off.error.message };
  const on = await db.from("product_images").update({ is_main: true }).eq("id", imageId).eq("product_id", productId).select("id");
  if (on.error) return { error: on.error.message };
  if (!on.data?.length) return { error: NOTHING };
  done();
  return {};
}

// ids = all photo ids of the product in the new order. Two steps (negative numbers first), so a unique rule on sort_order cannot get in the way
export async function reorderImages(ids: string[]): Promise<Result> {
  const { db } = await requireAdmin();
  for (const value of [(i: number) => -(i + 1), (i: number) => i]) {
    const res = await Promise.all(ids.map((id, i) => db.from("product_images").update({ sort_order: value(i) }).eq("id", id).select("id")));
    const bad = res.find((r) => r.error || !r.data?.length);
    if (bad) return { error: bad.error?.message ?? NOTHING };
  }
  done();
  return {};
}

// Deletes the record and the file; if it was the main photo, the next one becomes main
export async function deleteImage(imageId: string): Promise<Result> {
  const { db } = await requireAdmin();
  const { data: img } = await db.from("product_images").select("path, product_id, is_main").eq("id", imageId).maybeSingle();
  if (!img) return { error: NOTHING };
  const del = await db.from("product_images").delete().eq("id", imageId).select("id");
  if (del.error) return { error: del.error.message };
  if (!del.data?.length) return { error: NOTHING };
  await removeFiles(db, [img.path]);
  if (img.is_main) {
    const { data: first } = await db.from("product_images").select("id").eq("product_id", img.product_id).order("sort_order").limit(1);
    if (first?.[0]) await db.from("product_images").update({ is_main: true }).eq("id", first[0].id);
  }
  done();
  return {};
}
