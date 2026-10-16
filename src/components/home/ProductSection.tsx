import { useTranslations } from "next-intl";
import { ProductGrid } from "../product/ProductCard";
import { Container, SectionHead, SeeAllLink } from "../ui/Section";
import type { Product } from "@/lib/catalog";

export function ProductSection({ eyebrow, title, products }: { eyebrow: string; title: string; products: Product[] }) {
  const t = useTranslations("Home");
  return (
    <Container className="flex flex-col gap-7 py-8 lg:py-12">
      <SectionHead eyebrow={eyebrow} title={title} href="/catalog" linkText={t("seeAll")} />
      <ProductGrid products={products} />
      <SeeAllLink href="/catalog" className="w-full lg:hidden">{t("seeAllMobile")}</SeeAllLink>
    </Container>
  );
}
