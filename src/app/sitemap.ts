import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 60;

// Same visibility rule as the catalog; paginate instead of silently truncating
// at the Data API's default row limit. Let transient errors be retried by Next.
async function productPages(): Promise<{ path: string; date: string; category: string }[]> {
  const db = createPublicClient();
  const result: { path: string; date: string; category: string }[] = [];
  for (let offset = 0; ; offset += 200) {
    const { data, error } = await db.from("products")
      .select("slug,updated_at,categories!inner(slug,is_hidden),product_variants!inner(is_active)")
      .eq("is_published", true).eq("categories.is_hidden", false).eq("product_variants.is_active", true)
      .order("id").range(offset, offset + 199)
      .returns<{ slug: string; updated_at: string; categories: { slug: string } }[]>();
    if (error) throw error;
    result.push(...(data ?? []).map((row) => ({ path: `/product/${row.slug}`, date: row.updated_at, category: row.categories.slug })));
    if (!data || data.length < 200) break;
  }
  return result;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await productPages();
  // Only categories with a published product and an active variant belong in the sitemap.
  const categories = [...new Set(products.map((product) => product.category))].map((slug) => ({ path: `/catalog/${slug}`, date: "" }));
  const pages = [{ path: "", date: "" }, { path: "/catalog", date: "" }, { path: "/about", date: "" }, { path: "/privacy", date: "" }, { path: "/terms", date: "" }, ...categories, ...products];
  return pages.flatMap(({ path, date }) => {
    const languages = Object.fromEntries(routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`]));
    return routing.locales.map((locale) => ({ url: `${SITE_URL}/${locale}${path}`, ...(date && { lastModified: date }), alternates: { languages } }));
  });
}
