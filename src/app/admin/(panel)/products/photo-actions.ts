"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { removeFiles } from "@/lib/admin-storage";

type Result = { error?: string };
function done() {
  updateTag("storefront");
  revalidatePath("/", "layout");
}

export async function addImages(productId: string, items: { path: string; variantId: string | null }[]): Promise<Result> {
  const { db } = await requireAdmin();
  const { error } = await db.rpc("admin_add_images", { p_product_id: productId, p_items: items });
  if (error) return { error: error.message };
  done();
  return {};
}

export async function setMainImage(productId: string, imageId: string): Promise<Result> {
  const { db } = await requireAdmin();
  const { error } = await db.rpc("admin_set_main_image", { p_product_id: productId, p_image_id: imageId });
  if (error) return { error: error.message };
  done();
  return {};
}

export async function reorderImages(ids: string[]): Promise<Result> {
  const { db } = await requireAdmin();
  const { error } = await db.rpc("admin_reorder_images", { p_ids: ids });
  if (error) return { error: error.message };
  done();
  return {};
}

export async function deleteImage(imageId: string): Promise<Result> {
  const { db } = await requireAdmin();
  const { error } = await db.rpc("admin_delete_image", { p_image_id: imageId });
  if (error) return { error: error.message };
  await removeFiles(db);
  done();
  return {};
}
