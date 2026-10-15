"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Columns2, Heart, Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Quantity } from "@/components/ui/Quantity";
import { StockBadge } from "@/components/ui/StockBadge";
import { Check } from "lucide-react";
import { useFlash } from "@/lib/use-flash";
import { addToCart, toggleCompare, toggleFav, useStore } from "@/lib/store";
import type { Variant } from "@/lib/product";
import { getStockStatus } from "@/lib/stock";

// Whole numbers without decimals: 390 AZN, but 12.5 -> 12.50 AZN
const money = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)} AZN`;

export function ProductPurchase({ productId, eyebrow, name, description, variants }: { productId: string; eyebrow: string; name: string; description: string; variants: Variant[] }) {
  const t = useTranslations("Product");
  const s = useTranslations("Stock");
  const [id, setId] = useState(variants[0].id);
  const [qty, setQty] = useState(1);
  const [added, flash] = useFlash();
  const [full, setFull] = useState(false); // compare list is full
  const { fav, cmp } = useStore();
  const isFav = fav.includes(productId), isCmp = cmp.includes(productId);
  const v = variants.find((x) => x.id === id) ?? variants[0];
  const status = getStockStatus(v.stock);
  const max = v.stock > 0 ? v.stock : 10; // out of stock = order on request, allow a few

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3">
        <p className="text-[11px] font-semibold text-muted">{eyebrow}</p>
        <h1 className="text-[38px] font-semibold leading-[1.08] lg:text-[52px]">{name}</h1>
        <p className="text-xs text-muted">{t("model", { sku: v.sku })}</p>
        <StockBadge status={status} label={s(status)} />
      </div>
      {description && <p className="text-[15px] text-muted">{description}</p>}
      <p className="text-4xl font-semibold">{money(v.price)}</p>

      {variants.length > 1 && (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] font-medium">{t("variant", { name: v.name })}</p>
          <div className="flex flex-wrap gap-2.5">
            {variants.map((x) => (
              <Chip key={x.id} selected={x.id === id} onClick={() => { setId(x.id); setQty(1); }}>{x.name}</Chip>
            ))}
          </div>
          <p className="text-[11px] text-muted">{t("variantNote")}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Quantity value={qty} max={max} onChange={setQty} decreaseLabel={t("decrease")} increaseLabel={t("increase")} />
        <Button variant={added ? "success" : "primary"} className="flex-1" onClick={() => { addToCart(v.id, qty); flash(); }}>
          {added ? <><Check size={20} />{t("added")}</> : <><Plus size={20} />{t("addToCartFull")}</>}
        </Button>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" aria-pressed={isFav} className={`flex-1 ${isFav ? "border-danger text-danger hover:border-danger hover:bg-canvas hover:text-danger" : "hover:border-danger hover:bg-canvas hover:text-danger"}`} onClick={() => toggleFav(productId)}>
          <Heart size={20} className={isFav ? "fill-danger text-danger" : ""} />{isFav ? t("favoriteOn") : t("favorite")}
        </Button>
        <Button variant="secondary" aria-pressed={isCmp} className={`flex-1 ${isCmp ? "border-action bg-action-soft text-action" : ""}`} onClick={() => setFull(!toggleCompare(productId))}>
          <Columns2 size={20} />{isCmp ? t("compareOn") : t("compare")}
        </Button>
      </div>
      {full && <p role="status" className="text-xs text-warn">{t("compareFull")}</p>}

      <div id="delivery-info" className="flex gap-3 rounded-card bg-action-soft p-5">
        <Truck size={20} className="shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">{t("deliveryTitle")}</p>
          <p className="text-xs text-muted">{t("deliveryText")}</p>
        </div>
      </div>
      <p className="text-xs text-muted">{t("orderNote")}</p>
    </div>
  );
}
