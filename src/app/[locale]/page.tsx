import { getTranslations } from "next-intl/server";
import { Ambassadors } from "@/components/home/Ambassadors";
import { Categories } from "@/components/home/Categories";
import { Editorial } from "@/components/home/Editorial";
import { Hero } from "@/components/home/Hero";
import { Ordering } from "@/components/home/Ordering";
import { ProductSection } from "@/components/home/ProductSection";
import { getAmbassadors } from "@/lib/ambassadors";
import { getFeatured, getNew } from "@/lib/catalog";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("Home");
  // Load product lists and ambassadors in parallel
  const [featured, fresh, people] = await Promise.all([getFeatured(locale), getNew(locale), getAmbassadors(locale)]);
  return (
    <>
      <Hero />
      <Categories />
      <ProductSection eyebrow={t("featuredEyebrow")} title={t("featuredTitle")} products={featured} />
      <Editorial />
      <Ambassadors people={people} />
      <ProductSection eyebrow={t("newEyebrow")} title={t("newTitle")} products={fresh} />
      <Ordering />
    </>
  );
}
