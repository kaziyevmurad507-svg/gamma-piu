import { getTranslations } from "next-intl/server";
import { Categories } from "@/components/home/Categories";
import { Editorial } from "@/components/home/Editorial";
import { Hero } from "@/components/home/Hero";
import { Ordering } from "@/components/home/Ordering";
import { ProductSection } from "@/components/home/ProductSection";
import { getFeatured, getNew } from "@/lib/catalog";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("Home");
  // Load both product lists in parallel
  const [featured, fresh] = await Promise.all([getFeatured(locale), getNew(locale)]);
  return (
    <>
      <Hero />
      <Categories />
      <ProductSection eyebrow={t("featuredEyebrow")} title={t("featuredTitle")} products={featured} />
      <Editorial />
      <ProductSection eyebrow={t("newEyebrow")} title={t("newTitle")} products={fresh} />
      <Ordering />
    </>
  );
}
