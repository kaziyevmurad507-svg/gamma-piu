"use client";
import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Columns2, Info, MessageCircle, Plus, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { btnClass, Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageIntro, Skeleton } from "@/components/ui/PageIntro";
import { StockBadge } from "@/components/ui/StockBadge";
import { loadProducts } from "@/lib/actions";
import { money } from "@/lib/money";
import { getStockStatus } from "@/lib/stock";
import { groupCats } from "@/lib/categories";
import { addToCart, COMPARE_MAX, removeCompare, useStore } from "@/lib/store";
import { useLoaded } from "@/lib/use-loaded";
import { WA_URL } from "@/lib/whatsapp";

// A spec value can be plain text or { az, ru, en }
const text = (v: unknown, locale: string): string => {
  if (v && typeof v === "object") {
    const o = v as Record<string, string>;
    return o[locale] ?? o.az ?? Object.values(o)[0] ?? "";
  }
  return String(v ?? "");
};

export function CompareView() {
  const t = useTranslations("Compare");
  const p = useTranslations("Product");
  const n = useTranslations();
  const locale = useLocale();
  const { cmp, cmpGroup, ready } = useStore();
  const [onlyDiff, setOnlyDiff] = useState(false);
  const rows = useLoaded(cmp, (ids) => loadProducts(locale, ids));

  const items = (rows ?? []).filter((x) => cmp.includes(x.id));
  const loading = !ready || rows === null;

  // Matrix rows: category, then every spec key (first-seen order), color last
  const keys = [...new Set(items.flatMap((x) => Object.keys(x.specs)))].filter((k) => k !== "box" && k !== "color");
  const colorOf = (c: string | null) => (c ? (n.has(`Colors.${c}`) ? n(`Colors.${c}`) : c) : "");
  const matrix = [
    { key: "category", label: t("category"), values: items.map((x) => n(`Categories.${x.category}`)) },
    ...keys.map((k) => ({ key: k, label: n.has(`Specs.${k}`) ? n(`Specs.${k}`) : k.replace(/_/g, " "), values: items.map((x) => text(x.specs[k], locale)) })),
    ...(items.some((x) => x.color) ? [{ key: "color", label: t("color"), values: items.map((x) => colorOf(x.color)) }] : []),
  ]
    .map((r) => ({ ...r, values: r.values.map((v) => v || "—"), diff: items.length > 1 && new Set(r.values.map((v) => v || "—")).size > 1 }))
    .filter((r) => !onlyDiff || r.diff);

  return (
    <div className="flex flex-col gap-7">
      <PageIntro home={n("Nav.home")} crumb={n("Nav.compare")} title={t("title")} chip={items.length ? `${items.length} / ${COMPARE_MAX}` : undefined} text={t("intro")} />

      {loading ? (
        <Skeleton className="h-[272px]" />
      ) : !items.length ? (
        <div className="flex flex-col items-center gap-4 rounded-bento bg-media p-10 text-center">
          <Columns2 size={30} aria-hidden />
          <p className="text-[22px] font-medium">{t("emptyTitle")}</p>
          <p className="text-sm text-muted">{t("emptyText")}</p>
          <LinkButton href="/catalog">{n("Cart.toCatalog")}</LinkButton>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2.5 lg:flex-1">
              <button type="button" role="switch" aria-checked={onlyDiff} aria-label={t("onlyDiff")} onClick={() => setOnlyDiff(!onlyDiff)}
                className={`flex h-[26px] w-[42px] shrink-0 items-center rounded-full p-[3px] transition-colors duration-200 ease-in-out ${onlyDiff ? "bg-action" : "bg-line"}`}>
                <span className={`size-5 rounded-full bg-canvas shadow-soft transition-transform duration-200 ease-in-out ${onlyDiff ? "translate-x-4" : ""}`} />
              </button>
              <span className="text-[13px]">{t("onlyDiff")}</span>
            </div>
            {items.length < COMPARE_MAX && <LinkButton href={`/catalog?${groupCats(cmpGroup).map((c) => `cat=${c}`).join("&")}`} variant="secondary" className="w-full lg:w-auto"><Plus size={20} />{t("addProduct")}</LinkButton>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-3 lg:gap-5">
              <div className="hidden w-[260px] shrink-0 flex-col gap-5 pr-6 pt-[42px] lg:flex">
                <Columns2 size={32} aria-hidden />
                <p className="text-[28px] font-medium">{t("matrixTitle")}</p>
                <p className="text-[13px] text-muted">{t("matrixNote")}</p>
              </div>
              {items.map((x) => {
                const status = getStockStatus(x.stock);
                return (
                  <div key={x.id} className="flex min-w-0 flex-1 flex-col items-start gap-3 pb-5">
                    <div className="relative h-[170px] w-full rounded-card border border-line bg-canvas lg:h-[272px]">
                      {x.image && <Image src={x.image} alt="" fill sizes="(min-width:1024px) 30vw, 50vw" className="object-contain p-5" />}
                      <button type="button" aria-label={t("remove")} onClick={() => removeCompare(x.id)} className="photo-btn absolute right-2.5 top-2.5 grid size-11 place-items-center rounded-full bg-action-soft text-action shadow-soft">
                        <X size={16} />
                      </button>
                    </div>
                    <Link href={`/product/${x.slug}`} className="link-text text-base font-semibold lg:text-2xl">{x.name}</Link>
                    <StockBadge status={status} label={n(`Stock.${status}`)} />
                    <p className="text-[21px] font-semibold lg:text-[28px]">{money(x.price)}</p>
                    <Button className="w-full" onClick={() => addToCart(x.variantId)}>
                      <span className="hidden lg:inline">{t("addToCart")}</span><span className="lg:hidden">{p("addToCart")}</span>
                    </Button>
                  </div>
                );
              })}
            </div>

            {matrix.map((r) => (
              <div key={r.key} className="flex animate-rise flex-col gap-2.5 py-3.5 lg:flex-row lg:gap-5 lg:py-2">
                <div className="flex items-center lg:h-[52px] lg:w-[260px] lg:shrink-0">
                  <p className="flex-1 text-[13px] text-muted">{r.label}</p>
                  {items.length > 1 && <p className={`text-[10px] uppercase lg:hidden ${r.diff ? "text-warn" : "text-ok"}`}>{r.diff ? t("different") : t("same")}</p>}
                </div>
                <div className="flex min-w-0 flex-1 gap-3 lg:gap-5">
                  {r.values.map((v, i) => (
                    <p key={items[i].id} className={`flex min-h-[58px] min-w-0 flex-1 items-center rounded-panel px-3 py-2 text-xs font-medium lg:min-h-[52px] lg:rounded-card lg:px-6 lg:text-sm ${items.length < 2 ? "bg-media" : r.diff ? "bg-cream" : "bg-ok-soft text-ok"}`}>{v}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="flex gap-2.5 rounded-panel bg-cream p-4 text-xs text-warn"><Info size={18} className="shrink-0" aria-hidden />{n("Footer.notice")}</p>

          <div className="flex flex-col gap-6 rounded-bento bg-lavender p-8 lg:flex-row lg:items-center">
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-[26px] font-medium">{t("supportTitle")}</p>
              <p className="text-sm text-muted">{t("supportText")}</p>
            </div>
            <a href={`${WA_URL}?text=${encodeURIComponent(t("askText", { names: items.map((x) => x.name).join(", ") }))}`} target="_blank" rel="noopener noreferrer"
              className={btnClass()}>
              <MessageCircle size={20} />{t("support")}
            </a>
          </div>
        </>
      )}
    </div>
  );
}
