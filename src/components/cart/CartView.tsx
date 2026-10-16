"use client";
import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ChevronRight, MessageCircle, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { btnClass, IconButton } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageIntro, Skeleton } from "@/components/ui/PageIntro";
import { Quantity } from "@/components/ui/Quantity";
import { StockBadge } from "@/components/ui/StockBadge";
import { loadCartLines } from "@/lib/actions";
import { money } from "@/lib/money";
import { getStockStatus } from "@/lib/stock";
import { announceRemoved, removeFromCart, restoreLine, setQty, useStore } from "@/lib/store";
import { useLoaded } from "@/lib/use-loaded";
import { orderUrl } from "@/lib/whatsapp";

export function CartView() {
  const t = useTranslations("Cart");
  const p = useTranslations("Product");
  const n = useTranslations();
  const locale = useLocale();
  const { cart, ready } = useStore();
  const [leaving, setLeaving] = useState<string | null>(null); // line that is sliding out
  const [sent, setSent] = useState(false); // true after "Order" click: step 02 becomes active
  const [edits, setEdits] = useState(0); // grows on every quantity click, so prices "pop" only after a user action
  const rows = useLoaded(cart.map((l) => l.id), async (ids) => {
    const lines = await loadCartLines(locale, ids);
    ids.filter((id) => !lines.some((l) => l.id === id)).forEach(removeFromCart); // no longer on sale: drop from cart
    return lines;
  });

  // Fade the line out, remove it, and offer Undo
  const remove = (id: string, qty: number) => {
    setLeaving(id);
    setTimeout(() => {
      removeFromCart(id);
      setLeaving(null);
      announceRemoved(() => restoreLine(id, qty));
    }, 300);
  };

  // Join server data with the quantity saved in the browser
  const items = (rows ?? []).flatMap((l) => {
    const qty = cart.find((c) => c.id === l.id)?.qty;
    return qty ? [{ ...l, qty }] : [];
  });
  const units = items.reduce((sum, l) => sum + l.qty, 0);
  const total = items.reduce((sum, l) => sum + l.qty * l.price, 0);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const loading = !ready || rows === null;

  return (
    <div className="flex flex-col gap-8">
      <PageIntro home={n("Nav.home")} crumb={n("Nav.cart")} title={t("title")} chip={items.length ? t("count", { count: items.length }) : undefined} text={t("intro")} />

      <ol aria-label={t("steps")} className="flex items-center gap-3 text-xs lg:gap-6">
        <li aria-current={sent ? undefined : "step"} className={sent ? "text-muted" : "font-semibold text-action"}>01 {t("stepCart")}</li>
        <ChevronRight size={14} aria-hidden />
        <li aria-current={sent ? "step" : undefined} className={sent ? "font-semibold text-action" : "text-muted"}>02 WhatsApp</li>
        <ChevronRight size={14} aria-hidden />
        <li className="text-muted">03 {t("stepConfirm")}</li>
      </ol>

      {loading ? (
        <Skeleton className="h-[200px]" />
      ) : !items.length ? (
        <div className="flex flex-col items-center gap-4 rounded-bento bg-media p-10 text-center">
          <ShoppingBag size={30} aria-hidden />
          <p className="text-[22px] font-medium">{t("emptyTitle")}</p>
          <p className="text-sm text-muted">{t("emptyText")}</p>
          <LinkButton href="/catalog">{t("toCatalog")}</LinkButton>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="flex flex-1 flex-col items-start lg:min-w-0">
              {items.map((l) => {
                const status = getStockStatus(l.stock);
                const href = `/product/${l.slug}`;
                // Grid-rows trick: the row fades and collapses to height 0, then it is removed
                return (
                  <div key={l.id} className={`grid w-full transition-[grid-template-rows,opacity,transform] duration-300 ease-in-out ${leaving === l.id ? "-translate-x-6 grid-rows-[0fr] opacity-0" : "animate-rise grid-rows-[1fr]"}`}>
                    <div className="overflow-hidden pb-5">
                  <article className="flex w-full flex-col gap-[18px] rounded-card border border-line p-[18px] lg:flex-row lg:items-center lg:gap-5 lg:p-6">
                    <div className="flex items-center gap-5 lg:flex-1 lg:min-w-0">
                      <Link href={href} tabIndex={-1} aria-hidden className="relative h-[100px] w-[88px] shrink-0 rounded-panel bg-media lg:h-[130px] lg:w-[120px]">
                        {l.image && <Image src={l.image} alt="" fill sizes="120px" className="object-contain p-2" />}
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                        <Link href={href} className="link-text text-base font-semibold lg:text-xl">{l.name}</Link>
                        <p className="text-xs text-muted">{[l.category && n(`Categories.${l.category}`), l.variant].filter(Boolean).join(" · ")}</p>
                        <p className="text-[13px]">{t("perUnit", { price: money(l.price) })}</p>
                        <StockBadge status={status} label={n(`Stock.${status}`)} />
                      </div>
                    </div>
                    {/* lg:contents = on desktop these three sit in the same row as the photo */}
                    <div className="flex items-center justify-between lg:contents">
                      <Quantity value={l.qty} max={l.stock > 0 ? l.stock : 10} onChange={(v) => { setQty(l.id, v); setEdits(edits + 1); }} decreaseLabel={p("decrease")} increaseLabel={p("increase")} />
                      <p key={edits} className={`text-[19px] font-semibold lg:w-[100px] lg:text-right lg:text-[23px] ${edits ? "animate-pop" : ""}`}>{money(l.qty * l.price)}</p>
                      <IconButton aria-label={t("remove")} onClick={() => remove(l.id, l.qty)} className="text-muted"><Trash2 size={18} /></IconButton>
                    </div>
                  </article>
                    </div>
                  </div>
                );
              })}
              <LinkButton href="/catalog" variant="secondary"><ArrowLeft size={20} />{t("continue")}</LinkButton>
            </div>

            <aside className="flex animate-rise flex-col gap-6 rounded-bento bg-lavender p-6 lg:w-[400px] lg:shrink-0 lg:p-8">
              <h2 className="text-[26px] font-medium">{t("summaryTitle")}</h2>
              <dl className="flex flex-col gap-4 text-sm">
                <div className="flex justify-between"><dt className="text-muted">{t("products", { count: units })}</dt><dd key={edits} className={edits ? "animate-pop" : ""}>{money(total)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">{t("delivery")}</dt><dd className="text-ok">{money(0)}</dd></div>
                <div className="flex items-center justify-between border-t border-line pt-5"><dt className="font-medium">{t("total")}</dt><dd key={edits} className={`text-[30px] font-semibold ${edits ? "animate-pop" : ""}`}>{money(total)}</dd></div>
              </dl>
              {/* The link is built on click, so the site address (origin) is known */}
              <a href={orderUrl(items.map((l) => ({ name: l.name, variant: l.variant, qty: l.qty, price: l.price, link: `${origin}/${locale}/product/${l.slug}` })), t("waHead"), t("waTotal"), money(total).replace(/\u00a0/g, " "), (v) => money(v).replace(/\u00a0/g, " "))}
                target="_blank" rel="noopener noreferrer" onClick={() => setSent(true)} className={btnClass()}>
                <MessageCircle size={20} />{t("order")}
              </a>
              <p className="text-xs text-muted">{t("note")}</p>
              <p className="flex gap-2 text-xs"><ShieldCheck size={18} className="shrink-0 text-action" aria-hidden />{t("noCard")}</p>
            </aside>
          </div>

          <div className="flex flex-col gap-5 rounded-bento bg-cream p-6 lg:flex-row lg:p-8">
            <MessageCircle size={30} className="shrink-0 text-action" aria-hidden />
            <div className="flex flex-col gap-2">
              <p className="text-xl font-medium">{t("nextTitle")}</p>
              <p className="text-sm text-muted">{t("nextText")}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
