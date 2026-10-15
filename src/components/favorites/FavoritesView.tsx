"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Columns2, Heart, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageIntro, Skeleton } from "@/components/ui/PageIntro";
import { ProductCard } from "@/components/product/ProductCard";
import { loadProducts } from "@/lib/actions";
import { money } from "@/lib/money";
import { addManyToCart, useStore } from "@/lib/store";
import { useLoaded } from "@/lib/use-loaded";

type Sort = "recent" | "price-asc" | "price-desc";

export function FavoritesView() {
  const t = useTranslations("Favorites");
  const n = useTranslations();
  const locale = useLocale();
  const { fav, ready } = useStore();
  const [sort, setSort] = useState<Sort>("recent");
  const rows = useLoaded(fav, (ids) => loadProducts(locale, ids));

  // Removed favorites disappear at once, without waiting for a new request
  const list = (rows ?? []).filter((p) => fav.includes(p.id));
  if (sort === "recent") list.reverse(); // newest first
  else list.sort((a, b) => (sort === "price-asc" ? a.price - b.price : b.price - a.price));
  const total = list.reduce((sum, p) => sum + p.price, 0);
  const loading = !ready || rows === null;

  return (
    <div className="flex flex-col gap-8">
      <PageIntro home={n("Nav.home")} crumb={n("Nav.favorites")} title={t("title")} chip={list.length ? String(list.length) : undefined} text={t("intro")} />

      {loading ? (
        <Skeleton className="h-[268px]" />
      ) : !list.length ? (
        <div className="flex flex-col items-center gap-4 rounded-bento bg-media p-10 text-center">
          <Heart size={30} aria-hidden />
          <p className="text-[22px] font-medium">{t("emptyTitle")}</p>
          <p className="text-sm text-muted">{t("emptyText")}</p>
          <LinkButton href="/catalog">{n("Cart.toCatalog")}</LinkButton>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] text-muted">{t("countLine", { count: list.length })}</p>
            <label className="relative flex h-11 items-center gap-2 rounded-full bg-media pl-4 pr-10 text-[13px]">
              <span className="hidden lg:inline">{t("sortLabel")}:</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="appearance-none bg-transparent pr-1">
                <option value="recent">{t("sortRecent")}</option>
                <option value="price-asc">{n("Catalog.sort.price-asc")}</option>
                <option value="price-desc">{n("Catalog.sort.price-desc")}</option>
              </select>
              <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-4" />
            </label>
          </div>

          <div className="grid gap-x-6 gap-y-9 lg:grid-cols-3">
            {list.map((p) => <ProductCard key={p.id} p={p} wide />)}
          </div>

          <div className="flex flex-col gap-6 rounded-bento bg-lavender p-7 lg:flex-row lg:items-center lg:p-9">
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-[25px] font-medium lg:text-[30px]">{t("readyTitle")}</p>
              <p className="text-sm text-muted">{t("readyText", { count: list.length, total: money(total) })}</p>
            </div>
            <Button onClick={() => addManyToCart(list.map((p) => p.variantId))}><Plus size={20} />{t("addAll")}</Button>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-1 gap-4 rounded-card border border-line p-6">
              <Columns2 size={26} className="shrink-0 text-action" aria-hidden />
              <div className="flex flex-col gap-2">
                <p className="text-lg font-medium">{t("compareTitle")}</p>
                <p className="text-[13px] text-muted">{t("compareText")}</p>
                <Link href="/compare" className="text-[13px] font-semibold text-action">{t("compareLink")}</Link>
              </div>
            </div>
            <div className="flex flex-1 gap-4 rounded-card bg-media p-6">
              <Heart size={26} className="shrink-0 text-action" aria-hidden />
              <div className="flex flex-col gap-2">
                <p className="text-lg font-medium">{t("removeTitle")}</p>
                <p className="text-[13px] text-muted">{t("removeText")}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
