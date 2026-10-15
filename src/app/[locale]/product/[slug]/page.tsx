import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductCard";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductPurchase } from "@/components/product/ProductPurchase";
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
        <Link href="/">{t("Nav.home")}</Link>
        {category && <> / <Link href={`/catalog?cat=${p.category}`}>{category}</Link></>} / {p.name}
      </nav>

      <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:gap-16">
        <div className="lg:w-[624px] lg:shrink-0"><ProductGallery images={p.images} name={p.name} /></div>
        <div className="min-w-0 flex-1">
          <ProductPurchase productId={p.id} eyebrow={eyebrow} name={p.name} description={p.description} variants={p.variants} />
        </div>
      </div>

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
