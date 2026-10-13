import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductGrid } from "../product/ProductCard";
import { Container, SectionHead } from "../ui/Section";
import type { Product } from "@/lib/catalog";

export function ProductSection({ eyebrow, title, products }: { eyebrow: string; title: string; products: Product[] }) {
  const t = useTranslations("Home");
  return (
    <Container className="flex flex-col gap-7 py-8 lg:py-12">
      <SectionHead eyebrow={eyebrow} title={title} href="/catalog" linkText={t("seeAll")} />
      <ProductGrid products={products} />
      <Link href="/catalog" className="text-sm font-semibold text-action lg:hidden">{t("seeAllMobile")}</Link>
    </Container>
  );
}
