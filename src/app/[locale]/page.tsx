import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Ambassadors } from "@/components/home/Ambassadors";
import { Categories } from "@/components/home/Categories";
import { Editorial } from "@/components/home/Editorial";
import { Hero } from "@/components/home/Hero";
import { Ordering } from "@/components/home/Ordering";
import { ProductSection } from "@/components/home/ProductSection";
import { getAmbassadors } from "@/lib/ambassadors";
import { getFeatured, getNew } from "@/lib/catalog";
import { getProduct } from "@/lib/product";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, pageAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return { alternates: pageAlternates(locale) };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Pages can render alongside layouts; validate before reading request headers.
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  // Load product lists and ambassadors in parallel
  const [featured, fresh, people, boosted, dryer] = await Promise.all([
    getFeatured(locale), getNew(locale), getAmbassadors(locale),
    getProduct(locale, "clipper-boosted-up"), getProduct(locale, "5555"),
  ]);
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Store", name: "Gamma Piu", url: `${SITE_URL}/${locale}`, areaServed: "Baku", currenciesAccepted: "AZN" }} />
      <Hero boosted={boosted} dryer={dryer} />
      <Categories />
      <ProductSection eyebrow={t("featuredEyebrow")} title={t("featuredTitle")} products={featured} />
      <Editorial />
      <Ambassadors people={people} />
      <ProductSection eyebrow={t("newEyebrow")} title={t("newTitle")} products={fresh} />
      <Ordering />
    </>
  );
}
