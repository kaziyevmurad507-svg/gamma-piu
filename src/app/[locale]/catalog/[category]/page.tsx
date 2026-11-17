import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategoryCollection } from "@/lib/category-collection";
import { CATALOG_PAGE_SIZE } from "@/lib/catalog";
import { SITE_URL, NO_INDEX, breadcrumbData, openGraph, pageAlternates } from "@/lib/seo";
import { CategoryLinks } from "@/components/catalog/CategoryLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductGrid } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/Section";
import { btnClass } from "@/components/ui/Button";
import { WA_URL } from "@/lib/whatsapp";

type Props = { params: Promise<{ locale: string; category: string }>; searchParams: Promise<{ page?: string | string[] }> };
const requestedPage = (value?: string | string[]) => Number(Array.isArray(value) ? value[0] : value) || 1;
const collectionPath = (slug: string, page: number) => `/catalog/${slug}${page > 1 ? `?page=${page}` : ""}`;

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, category } = await params;
  const data = await getCategoryCollection(locale, category, requestedPage((await searchParams).page));
  if (!data) notFound();
  const t = await getTranslations({ locale, namespace: "Category" });
  const pagination = await getTranslations({ locale, namespace: "Catalog" });
  const baseTitle = t("title", { category: data.category.name });
  const title = data.page > 1 ? `${baseTitle} · ${pagination("page", { page: data.page, pages: data.pages })}` : baseTitle;
  const description = t("intro", { category: data.category.name });
  return {
    title, description,
    alternates: pageAlternates(locale, collectionPath(category, data.page)),
    openGraph: openGraph(locale, { title, description }),
    twitter: { card: "summary_large_image", title, description, images: [`${SITE_URL}/images/share-card.png`] },
    ...(!data.total ? { robots: NO_INDEX } : {}),
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, category } = await params;
  const data = await getCategoryCollection(locale, category, requestedPage((await searchParams).page));
  if (!data) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const { products, total, page, pages } = data;
  const title = t("Category.title", { category: data.category.name });
  const description = t("Category.intro", { category: data.category.name });
  const url = `${SITE_URL}/${locale}${collectionPath(category, page)}`;
  return (
    <Container className="flex flex-col gap-8 pb-16 pt-8">
      <JsonLd data={breadcrumbData(locale, [
        { name: t("Nav.home"), path: "" }, { name: t("Nav.catalog"), path: "/catalog" },
        { name: data.category.name, path: `/catalog/${category}` },
      ])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${url}#collection`, url,
        name: title, description, inLanguage: locale,
        mainEntity: { "@type": "ItemList", numberOfItems: total, itemListOrder: "https://schema.org/ItemListUnordered",
          itemListElement: products.map((product, index) => ({ "@type": "ListItem", position: (page - 1) * CATALOG_PAGE_SIZE + index + 1,
            name: product.name, url: `${SITE_URL}/${locale}/product/${product.slug}` })) },
      }} />
      <div className="flex flex-col gap-3.5">
        <nav aria-label={t("Product.breadcrumb")} className="text-xs text-muted">
          <Link href="/" className="link-text">{t("Nav.home")}</Link> / <Link href="/catalog" className="link-text">{t("Nav.catalog")}</Link> / {data.category.name}
        </nav>
        <h1 className="hyphens-auto break-words text-[34px] font-semibold leading-[1.12] lg:text-5xl">{title}</h1>
        <p className="max-w-3xl text-sm text-muted lg:text-base">{description}</p>
        <p className="text-sm font-semibold text-action">{t("Catalog.count", { count: total })}</p>
      </div>
      {products.length ? <ProductGrid products={products} /> : <p className="text-muted">{t("Category.empty")}</p>}
      {pages > 1 && <nav aria-label={t("Catalog.page", { page, pages })} className="flex flex-wrap items-center justify-center gap-3">
        {page > 1 && <Link href={collectionPath(category, page - 1)} rel="prev" className={btnClass("secondary")}>{t("Catalog.previous")}</Link>}
        <span className="text-sm" aria-current="page">{t("Catalog.page", { page, pages })}</span>
        {page < pages && <Link href={collectionPath(category, page + 1)} rel="next" className={btnClass("secondary")}>{t("Catalog.next")}</Link>}
      </nav>}
      <div className="flex flex-wrap gap-3">
        <Link href={`/catalog?cat=${encodeURIComponent(category)}`} className={btnClass("secondary")}>{t("Category.filters")}</Link>
        <a href={WA_URL} target="_blank" rel="noopener noreferrer" className={btnClass()}>{t("Category.help")}</a>
      </div>
      <section className="flex max-w-3xl flex-col gap-4 rounded-card bg-media p-6 lg:p-8">
        <h2 className="text-2xl font-semibold">{t("Category.guideTitle")}</h2>
        <p className="text-sm leading-relaxed text-muted lg:text-base">{t.has(`Category.guides.${category}`) ? t(`Category.guides.${category}`) : t("Category.guideDefault")}</p>
        <p className="text-sm leading-relaxed text-muted">{t("Category.ordering")}</p>
      </section>
      <CategoryLinks categories={data.categories} current={category} title={t("Category.explore")} />
    </Container>
  );
}
