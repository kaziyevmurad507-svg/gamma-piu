"use client";
import { Check, Columns2, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { btnClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { addToCart, toggleCompare, toggleFav, useStore } from "@/lib/store";
import { useFlash } from "@/lib/use-flash";

const round = "grid size-11 place-items-center rounded-full bg-canvas shadow-soft transition duration-150 hover:scale-110 active:scale-90";

// Heart on a product card: id = product id. Red when the product is a favorite
export function FavoriteButton({ id }: { id: string }) {
  const t = useTranslations("Product");
  const on = useStore().fav.includes(id);
  return (
    <button type="button" aria-pressed={on} aria-label={on ? t("removeFavorite") : t("addFavorite")} onClick={() => toggleFav(id)} className={`absolute right-3 top-3 ${round}`}>
      <Heart size={18} className={cn("transition-colors", on ? "fill-danger text-danger" : "hover:text-danger")} />
    </button>
  );
}

// Compare toggle under the heart: id = product id. Shows a short note when the list is full
export function CompareButton({ id }: { id: string }) {
  const t = useTranslations("Product");
  const on = useStore().cmp.includes(id);
  const [full, flash] = useFlash(2500);
  return (
    <>
      <button type="button" aria-pressed={on} aria-label={on ? t("compareOn") : t("compare")} title={on ? t("compareOn") : t("compare")}
        onClick={() => { if (!toggleCompare(id)) flash(); }} className={cn("absolute right-3 top-[60px]", round, on && "bg-action text-white")}>
        <Columns2 size={18} />
      </button>
      {full && <p role="status" className="absolute right-3 top-[108px] z-10 max-w-[180px] rounded-panel bg-ink px-3 py-2 text-xs text-white">{t("compareFull")}</p>}
    </>
  );
}

// id = variant id. className lets a card override the default width. Turns green for 1.5 s after a click
export function AddToCartButton({ id, className = "w-full lg:w-auto" }: { id: string; className?: string }) {
  const t = useTranslations("Product");
  const [added, flash] = useFlash();
  return (
    <button type="button" onClick={() => { addToCart(id); flash(); }} className={cn(btnClass(added ? "success" : "primary"), "h-12", className)}>
      {added ? <><Check size={18} />{t("added")}</> : t("addToCart")}
    </button>
  );
}
