import { useLocale, useTranslations } from "next-intl";
import { Info, MessageCircle, Package } from "lucide-react";
import { WA_URL } from "@/lib/whatsapp";

// A spec value can be plain text or { az, ru, en }
const text = (v: unknown, locale: string): string => {
  if (v && typeof v === "object") {
    const o = v as Record<string, string>;
    return o[locale] ?? o.az ?? Object.values(o)[0] ?? "";
  }
  return String(v ?? "");
};

const tab = "flex h-11 items-center rounded-full bg-media px-4 text-[13px] hover:bg-line";

export function ProductInfo({ name, specs }: { name: string; specs: Record<string, unknown> }) {
  const t = useTranslations();
  const locale = useLocale();
  // "box" holds the box contents text, "color" is only used by catalog filters
  const rows = Object.entries(specs).filter(([k]) => k !== "box" && k !== "color");
  const box = text(specs.box, locale) || t("Product.boxFallback");

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {rows.length > 0 && <a href="#specs" className={tab}>{t("Product.tabSpecs")}</a>}
        <a href="#box" className={tab}>{t("Product.tabBox")}</a>
        <a href="#delivery-info" className={tab}>{t("Product.tabDelivery")}</a>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {rows.length > 0 && (
          <section id="specs" className="flex scroll-mt-6 flex-col gap-5 rounded-bento bg-media p-6 lg:flex-1 lg:p-8">
            <h2 className="text-2xl font-medium">{t("Product.specsTitle")}</h2>
            <p className="text-xs text-muted">{t("Product.specsNote")}</p>
            <dl className="flex flex-col gap-3.5">
              {rows.map(([k, v]) => (
                <div key={k} className="flex gap-5 border-b border-line pb-3 text-[13px]">
                  <dt className="flex-1 text-muted">{t.has(`Specs.${k}`) ? t(`Specs.${k}`) : k.replace(/_/g, " ")}</dt>
                  <dd className="flex-1 text-right font-medium">{text(v, locale)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        <section id="box" className="flex scroll-mt-6 flex-col items-start gap-6 rounded-bento bg-cream p-8 lg:w-[440px] lg:shrink-0">
          <Package size={30} />
          <h2 className="text-[26px] font-medium">{t("Product.boxTitle")}</h2>
          <p className="text-sm text-muted">{box}</p>
          <p className="text-[13px]">{t("Product.boxHint")}</p>
          <a href={`${WA_URL}?text=${encodeURIComponent(t("Product.askText", { name }))}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-line bg-canvas px-[22px] text-sm font-semibold hover:bg-media">
            <MessageCircle size={20} />{t("Product.ask")}
          </a>
        </section>
      </div>

      <p className="flex gap-2.5 rounded-panel bg-cream p-4 text-xs text-warn"><Info size={18} className="shrink-0" />{t("Footer.notice")}</p>
    </>
  );
}
