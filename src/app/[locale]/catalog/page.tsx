import { getTranslations } from "next-intl/server";
import { ArrowUp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CatalogForm } from "@/components/catalog/CatalogForm";
import { ProductGrid } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/Section";
import { getProducts } from "@/lib/catalog";
import { CATEGORIES, COLORS, SORTS } from "@/lib/categories";

type SP = Record<string, string | string[] | undefined>;
const all = (v: SP[string]) => (Array.isArray(v) ? v : v ? [v] : []);
const one = (v: SP[string]) => all(v)[0] ?? "";
// Keep only values from a known list (ignores junk in the URL)
const only = <T extends string>(v: SP[string], ok: readonly T[]) => all(v).filter((x): x is T => (ok as readonly string[]).includes(x));
const num = (s: string) => (s !== "" && Number.isFinite(+s) ? +s : undefined);
const chip = "flex h-11 items-center rounded-full px-4 text-[13px]";

export default async function CatalogPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SP> }) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations();

  const v = {
    q: one(sp.q).slice(0, 80), cats: only(sp.cat, CATEGORIES), min: one(sp.min), max: one(sp.max),
    avail: only(sp.avail, ["stock", "order"] as const), colors: only(sp.color, COLORS), sort: only(sp.sort, SORTS)[0] ?? "recommended",
  };
  const products = await getProducts(locale, { q: v.q, cats: v.cats, min: num(v.min), max: num(v.max), avail: v.avail, colors: v.colors, sort: v.sort });

  return (
    <Container id="catalog-top" className="flex flex-col gap-8 pb-16 pt-8">
      <div className="flex flex-col gap-3.5">
        <p className="text-xs text-muted"><Link href="/">{t("Nav.home")}</Link> / {t("Nav.catalog")}</p>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[34px] font-semibold leading-[1.12] lg:text-5xl">{t("Catalog.title")}</h1>
          <span className={`${chip} shrink-0 bg-action-soft font-semibold text-action`}>{t("Catalog.count", { count: products.length })}</span>
        </div>
        <p className="text-sm text-muted lg:text-base">{t("Catalog.intro")}</p>
      </div>

      <CatalogForm v={v} count={products.length}>
        <div className="flex flex-wrap gap-2">
          {(v.cats.length ? v.cats : [""]).map((s) => (
            <span key={s} className={`${chip} bg-action-soft font-semibold text-action`}>{s ? t(`Categories.${s}`) : t("Catalog.allCategories")}</span>
          ))}
          {(v.min || v.max) && <span className={`${chip} bg-media`}>{v.min || "0"}–{v.max || "∞"} AZN</span>}
        </div>
        {products.length ? (
          <>
            <ProductGrid products={products} className="lg:grid-cols-3" />
            <div className="flex flex-col items-center gap-3.5 pt-6">
              <p className="text-xs text-muted">{t("Catalog.shown", { shown: products.length, total: products.length })}</p>
              <a href="#catalog-top" className="flex h-12 items-center gap-2.5 rounded-full border border-line px-[22px] text-sm font-semibold"><ArrowUp size={18} />{t("Catalog.backToTop")}</a>
            </div>
          </>
        ) : (
          <p className="py-16 text-center text-muted">{t("Catalog.empty")}</p>
        )}
      </CatalogForm>
    </Container>
  );
}
