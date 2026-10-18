import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductGrid } from "@/components/product/ProductCard";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductMain } from "@/components/product/ProductMain";
import { Container } from "@/components/ui/Section";
import { getProduct, getRelated } from "@/lib/product";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const p = await getProduct(locale, slug);
  return p ? { title: `${p.name} · Gamma Piu`, description: p.description.slice(0, 160) } : {};
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  const p = await getProduct(locale, slug);
  if (!p) notFound();
  const [t, related] = await Promise.all([getTranslations(), getRelated(locale, p.id)]);
  const category = p.category ? t(`Categories.${p.category}`) : "";
  const eyebrow = [p.brand ?? "Gamma Piu", category].filter(Boolean).join(" · ").toLocaleUpperCase(locale);

  return (
    <Container className="flex flex-col gap-10 pb-16 pt-6">
      <nav aria-label={t("Product.breadcrumb")} className="text-xs text-muted">
        <Link href="/" className="link-text">{t("Nav.home")}</Link>
        {category && <> / <Link href={`/catalog?cat=${p.category}`} className="link-text">{category}</Link></>} / {p.name}
      </nav>

      <ProductMain productId={p.id} category={p.category} eyebrow={eyebrow} name={p.name} description={p.description} variants={p.variants} images={p.images} />

      <ProductInfo name={p.name} specs={p.specs} />

      {related.length > 0 && (
        <section className="flex flex-col gap-8">
          <h2 className="text-[28px] font-semibold leading-[1.15] lg:text-[38px]">{t("Product.completeKit")}</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </Container>
  );
}
