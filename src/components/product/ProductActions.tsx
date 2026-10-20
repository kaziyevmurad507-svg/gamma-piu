"use client";
import { Check, Columns2, Heart } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { btnClass } from "@/components/ui/Button";
import { useCategories } from "@/components/layout/CategoriesProvider";
import { groupName } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { addToCart, replaceCompare, toggleCompare, toggleFav, useStore } from "@/lib/store";
import { useFlash } from "@/lib/use-flash";

const round = "photo-btn grid size-11 place-items-center rounded-full shadow-soft";

// Heart on a product card: id = product id. Red when the product is a favorite
export function FavoriteButton({ id }: { id: string }) {
  const t = useTranslations("Product");
  const on = useStore().fav.includes(id);
  const [clicks, setClicks] = useState(0); // new key = heart "beats" after every click
  return (
    <button type="button" aria-pressed={on} aria-label={on ? t("removeFavorite") : t("addFavorite")} onClick={() => { setClicks(clicks + 1); toggleFav(id); }} className={`absolute right-3 top-3 bg-action-soft text-action ${round}`}>
      <Heart key={clicks} size={18} className={cn("transition-colors", clicks > 0 && "animate-heart", on ? "fill-danger text-danger" : "hover:text-danger")} />
    </button>
  );
}

// Shared by the card button and the product page button
export function useCompare(id: string, group: string) {
  const { cmp } = useStore();
  const [ask, setAsk] = useState(false); // list has another category: ask before replacing
  const [full, flash] = useFlash(2500);
  const cancel = useCallback(() => setAsk(false), []);
  return {
    on: cmp.includes(id), full, ask,
    toggle: () => { const r = toggleCompare(id, group); if (r === "other") setAsk(true); else if (r === "full") flash(); },
    replace: () => { replaceCompare(id, group); setAsk(false); },
    // useCallback keeps the same function between renders, so the outside-click listener is not re-created
    cancel,
  };
}

// Small question box: "Comparison has X. Replace the list with Y?"
export function ReplaceNotice({ group, onReplace, onCancel, className }: { group: string; onReplace: () => void; onCancel: () => void; className: string }) {
  const t = useTranslations();
  const cats = useCategories();
  const { cmpGroup } = useStore();
  const box = useRef<HTMLDivElement>(null);
  // Close on a click anywhere else, or Escape
  useEffect(() => {
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) onCancel(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [onCancel]);
  return (
    <div ref={box} role="alertdialog" aria-label={t("Product.replaceTitle")} className={`flex animate-drop flex-col gap-3 rounded-card border border-line bg-canvas p-4 text-xs shadow-soft ${className}`}>
      <p>{t("Product.replaceText", { from: groupName(cats, cmpGroup), to: groupName(cats, group) })}</p>
      <div className="flex gap-2">
        <button type="button" onClick={onReplace} className="h-9 flex-1 rounded-full bg-action px-3 font-semibold text-white transition hover:bg-action-hover active:scale-95">{t("Product.replace")}</button>
        <button type="button" onClick={onCancel} className="h-9 flex-1 rounded-full border border-line px-3 font-semibold transition hover:border-action hover:text-action active:scale-95">{t("Product.cancel")}</button>
      </div>
    </div>
  );
}

// Compare toggle under the heart on a card
export function CompareButton({ id, group }: { id: string; group: string }) {
  const t = useTranslations("Product");
  const c = useCompare(id, group);
  return (
    <>
      <button type="button" aria-pressed={c.on} aria-label={c.on ? t("compareOn") : t("compare")} title={c.on ? t("compareOn") : t("compare")}
        onClick={c.toggle} className={cn("absolute right-3 top-[60px]", round, c.on ? "bg-action text-white" : "bg-action-soft text-action")}>
        <Columns2 size={18} />
      </button>
      {c.full && <p role="status" className="absolute animate-drop right-3 top-[108px] z-10 max-w-[180px] rounded-panel bg-ink px-3 py-2 text-xs text-canvas">{t("compareFull")}</p>}
      {c.ask && <ReplaceNotice group={group} onReplace={c.replace} onCancel={c.cancel} className="absolute right-3 top-[108px] z-20 w-[230px]" />}
    </>
  );
}

// id = variant id. className lets a card override the default width. Turns green for 1.5 s after a click
export function AddToCartButton({ id, className = "w-full lg:w-auto" }: { id: string; className?: string }) {
  const t = useTranslations("Product");
  const [added, flash] = useFlash();
  return (
    <button type="button" onClick={() => { addToCart(id); flash(); }} className={cn(btnClass(added ? "success" : "primary"), "h-12", className)}>
      <span key={String(added)} className="inline-flex animate-drop items-center gap-2">{added ? <><Check size={18} />{t("added")}</> : t("addToCart")}</span>
    </button>
  );
}
