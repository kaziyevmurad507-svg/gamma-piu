import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductGrid } from "@/components/product/ProductCard";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductMain } from "@/components/product/ProductMain";
import { Container } from "@/components/ui/Section";
import { getProduct, getRelated } from "@/lib/product";
import { getSpecTypes } from "@/lib/spec-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, openGraph, pageAlternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const p = await getProduct(locale, slug);
  if (!p) return {};
  const description = p.description.slice(0, 160) || undefined;
  const images = p.images[0] ? [p.images[0].url] : undefined; // main photo first
  return { title: `${p.name} · Gamma Piu`, description, alternates: pageAlternates(locale, `/product/${slug}`), openGraph: openGraph(locale, { title: p.name, description, images }) };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  const p = await getProduct(locale, slug);
  if (!p) notFound();
  const [t, related, types] = await Promise.all([getTranslations(), getRelated(locale, p.id), getSpecTypes(locale)]);
  const category = p.categoryName;
  const eyebrow = [p.brand ?? "Gamma Piu", category].filter(Boolean).join(" · ").toLocaleUpperCase(locale);

  // Structured data for Google: price range over the variants, in stock if any variant is
  const prices = p.variants.map((v) => v.price);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, sku: p.variants[0].sku, url: `${SITE_URL}/${locale}/product/${p.slug}`,
    ...(p.description && { description: p.description }), ...(p.images[0] && { image: p.images.slice(0, 5).map((i) => i.url) }), ...(p.brand && { brand: { "@type": "Brand", name: p.brand } }),
    offers: { "@type": "AggregateOffer", priceCurrency: "AZN", lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: p.variants.length, availability: p.variants.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  };

  return (
    <Container className="flex flex-col gap-10 pb-16 pt-6">
      <JsonLd data={jsonLd} />
      <nav aria-label={t("Product.breadcrumb")} className="text-xs text-muted">
        <Link href="/" className="link-text">{t("Nav.home")}</Link>
        {category && <> / <Link href={`/catalog?cat=${p.category}`} className="link-text">{category}</Link></>} / {p.name}
      </nav>

      <ProductMain productId={p.id} group={p.group} eyebrow={eyebrow} name={p.name} description={p.description} variants={p.variants} images={p.images} />

      <ProductInfo name={p.name} specs={p.specs} types={types} />

      {related.length > 0 && (
        <section className="flex flex-col gap-8">
          <h2 className="text-[28px] font-semibold leading-[1.15] lg:text-[38px]">{t("Product.completeKit")}</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </Container>
  );
}
