import { createClient } from "@/lib/supabase/server";
import { BUCKET } from "./admin-storage";
import { pick } from "./i18n-field";

export type Ambassador = { id: string; name: string; role: string; url: string | null; handle: string | null; image: string | null };

// Allowed Instagram input: "@name", "name" or a link like https://instagram.com/name
export const INSTAGRAM = /^(https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?|@?[A-Za-z0-9._]{1,30})$/;
const handleOf = (v: string) => v.replace(/^https:\/\/(www\.)?instagram\.com\//, "").replace(/^@/, "").replace(/\/$/, "");

// Published ambassadors in the admin's order. If the table is missing, the section is simply empty
export async function getAmbassadors(locale: string): Promise<Ambassador[]> {
  const db = await createClient();
  const { data } = await db.from("ambassadors").select("id, name, role_az, role_ru, role_en, instagram, image_path").eq("is_published", true).order("sort_order");
  return (data ?? []).map((r) => ({
    id: r.id, name: r.name, role: pick(r, "role", locale),
    url: r.instagram ? `https://instagram.com/${handleOf(r.instagram)}` : null,
    handle: r.instagram ? `@${handleOf(r.instagram)}` : null,
    image: r.image_path ? db.storage.from(BUCKET).getPublicUrl(r.image_path).data.publicUrl : null,
  }));
}
