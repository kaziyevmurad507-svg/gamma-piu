"use client";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";

// Placeholders for step 4. Step 6 adds real favorites / cart logic here.
export function FavoriteButton({ id }: { id: string }) {
  const t = useTranslations("Product");
  return (
    <button type="button" data-id={id} aria-label={t("addFavorite")} className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-canvas">
      <Heart size={18} />
    </button>
  );
}

export function AddToCartButton({ id }: { id: string }) {
  const t = useTranslations("Product");
  return (
    <button type="button" data-id={id} className="h-12 w-full rounded-full bg-action px-[22px] text-sm font-semibold text-canvas lg:w-auto">
      {t("addToCart")}
    </button>
  );
}
