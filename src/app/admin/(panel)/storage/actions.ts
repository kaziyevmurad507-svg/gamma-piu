"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { removeFiles } from "@/lib/admin-storage";

export async function retryStorageCleanup() {
  const { db } = await requireAdmin();
  const result = await removeFiles(db);
  revalidatePath("/admin/storage");
  redirect(`/admin/storage?removed=${result.removed}&pending=${result.pending ? "1" : "0"}`);
}
