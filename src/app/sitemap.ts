import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600; // rebuild at most once an hour

type Row = { slug: string; updated_at: string; product_variants: { is_active: boolean }[] };

// Same rule as the site: published, category not hidden, at least one active variant
async function productPages(): Promise<{ path: string; date: string }[]> {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
    const { data } = await db.from("products").select("slug, updated_at, categories!inner(is_hidden), product_variants(is_active)").eq("is_published", true).eq("categories.is_hidden", false);
    return ((data ?? []) as unknown as Row[]).filter((r) => r.product_variants.some((v) => v.is_active)).map((r) => ({ path: `/product/${r.slug}`, date: r.updated_at }));
  } catch {
    return []; // no database: the sitemap still lists the static pages
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [{ path: "", date: "" }, { path: "/catalog", date: "" }, { path: "/about", date: "" }, ...(await productPages())];
  // One entry per page and language, each one lists all language versions (hreflang)
  return pages.flatMap(({ path, date }) => {
    const languages = Object.fromEntries(routing.locales.map((l) => [l, `${SITE_URL}/${l}${path}`]));
    return routing.locales.map((l) => ({ url: `${SITE_URL}/${l}${path}`, ...(date && { lastModified: date }), alternates: { languages } }));
  });
}
