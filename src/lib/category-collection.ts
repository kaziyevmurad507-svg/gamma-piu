import { cache } from "react";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getCategories } from "./category-data";
import { getCatalogPage } from "./catalog";

// Metadata and rendering share the same public category/products read.
export const getCategoryCollection = cache(async (locale: string, slug: string, requestedPage: number) => {
  if (!hasLocale(routing.locales, locale)) return null;
  const categories = await getCategories(locale);
  const category = categories.find((item) => item.slug === slug);
  if (!category) return null;
  return { category, categories, ...await getCatalogPage(locale, { cats: [slug] }, requestedPage) };
});
