import { btnClass } from "@/components/ui/Button";
import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { ArrowUp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CatalogForm } from "@/components/catalog/CatalogForm";
import { CategoryLinks } from "@/components/catalog/CategoryLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductGrid } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/Section";
import { PageIntro } from "@/components/ui/PageIntro";
import { CATALOG_PAGE_SIZE, getCatalogPage } from "@/lib/catalog";
import { getCategories } from "@/lib/category-data";
import { COLORS, SORTS } from "@/lib/categories";
import { SITE_URL, NO_INDEX, breadcrumbData, openGraph, pageAlternates } from "@/lib/seo";

type SP = Record<string, string | string[] | undefined>;
const all = (v: SP[string]) => (Array.isArray(v) ? v : v ? [v] : []);
const one = (v: SP[string]) => all(v)[0] ?? "";
// Keep only values from a known list (ignores junk in the URL)
const only = <T extends string>(v: SP[string], ok: readonly T[]) => all(v).filter((x): x is T => (ok as readonly string[]).includes(x));
const num = (s: string) => (s !== "" && Number.isFinite(+s) ? +s : undefined);
const chip = "flex h-11 items-center rounded-full px-4 text-[13px]";

// Primitive keys let metadata and rendering share the public read, including the clamped page number.
const readCatalog = cache(async (locale: string, search: string) => {
  const sp = JSON.parse(search) as SP;
  const cats = (await getCategories(locale)).filter((c) => !c.hidden);
  const v = {
    q: one(sp.q).slice(0, 80), cats: [...new Set(only(sp.cat, cats.map((c) => c.slug)))], min: one(sp.min), max: one(sp.max),
    avail: only(sp.avail, ["stock", "order"] as const), colors: only(sp.color, COLORS), sort: only(sp.sort, SORTS)[0] ?? "recommended",
  };
  return { cats, v, ...await getCatalogPage(locale, { q: v.q, cats: v.cats, min: num(v.min), max: num(v.max), avail: v.avail, colors: v.colors, sort: v.sort }, Number(one(sp.page)) || 1) };
});

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SP> }) {
  const { locale } = await params;
  const { cats, v, page, pages, total } = await readCatalog(locale, JSON.stringify(await searchParams));
  const t = await getTranslations({ locale });
  const category = v.cats.length === 1 ? cats.find((cat) => cat.slug === v.cats[0]) : undefined;
  const base = category ? `/catalog/${category.slug}` : "/catalog";
  const baseTitle = category ? t("Category.title", { category: category.name }) : t("Catalog.metaTitle");
  const title = page > 1 ? `${baseTitle} · ${t("Catalog.page", { page, pages })}` : baseTitle;
  const description = category ? t("Category.intro", { category: category.name }) : t("Catalog.intro");
  const refined = Boolean(v.q || v.min || v.max || v.colors.length || v.avail.length || v.cats.length > 1 || v.sort !== "recommended");
  return { title, description, alternates: pageAlternates(locale, `${base}${page > 1 ? `?page=${page}` : ""}`),
    openGraph: openGraph(locale, { title, description }),
    twitter: { card: "summary_large_image", title, description, images: [`${SITE_URL}/images/share-card.png`] },
    ...(refined || !total ? { robots: NO_INDEX } : {}),
  };
}

export default async function CatalogPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SP> }) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations();
  const { cats, v, products, total, page, pages } = await readCatalog(locale, JSON.stringify(sp));
  const pageHref = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) if (key !== "page") for (const item of all(value)) query.append(key, item);
    if (target > 1) query.set("page", String(target));
    return `/catalog${query.size ? `?${query}` : ""}`;
  };

  return (
    <Container id="catalog-top" className="flex flex-col gap-8 pb-16 pt-8">
      <JsonLd data={breadcrumbData(locale, [{ name: t("Nav.home"), path: "" }, { name: t("Nav.catalog"), path: "/catalog" }])} />
      <PageIntro home={t("Nav.home")} crumb={t("Nav.catalog")} title={t("Catalog.title")} chip={t("Catalog.count", { count: total })} text={t("Catalog.intro")} />

      <CategoryLinks categories={cats} title={t("Category.explore")} />

      <CatalogForm v={v} count={total}>
        <div className="flex flex-wrap gap-2">
          {(v.cats.length ? v.cats : [""]).map((s) => (
            <span key={s} className={`${chip} bg-action-soft font-semibold text-action`}>{s ? cats.find((c) => c.slug === s)?.name : t("Catalog.allCategories")}</span>
          ))}
          {(v.min || v.max) && <span className={`${chip} bg-media`}>{v.min || "0"}–{v.max || "∞"} AZN</span>}
        </div>
        {products.length ? (
          <>
            <ProductGrid products={products} className="lg:grid-cols-3" />
            <div className="flex flex-col items-center gap-3.5 pt-6">
              <p className="text-xs text-muted">{t("Catalog.shown", { shown: Math.min(page * CATALOG_PAGE_SIZE, total), total })}</p>
              {pages > 1 && <nav aria-label={t("Catalog.page", { page, pages })} className="flex flex-wrap items-center justify-center gap-3">
                {page > 1 && <Link href={pageHref(page - 1)} rel="prev" className={btnClass("secondary")}>{t("Catalog.previous")}</Link>}
                <span className="text-sm" aria-current="page">{t("Catalog.page", { page, pages })}</span>
                {page < pages && <Link href={pageHref(page + 1)} rel="next" className={btnClass("secondary")}>{t("Catalog.next")}</Link>}
              </nav>}
              <a href="#catalog-top" className={btnClass("secondary")}><ArrowUp size={18} />{t("Catalog.backToTop")}</a>
            </div>
          </>
        ) : (
          <p className="py-16 text-center text-muted">{t("Catalog.empty")}</p>
        )}
      </CatalogForm>
    </Container>
  );
}
