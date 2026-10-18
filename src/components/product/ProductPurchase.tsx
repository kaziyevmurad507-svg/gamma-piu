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
import { ReplaceNotice, useCompare } from "./ProductActions";
import { addToCart, toggleFav, useStore } from "@/lib/store";
import type { Variant } from "@/lib/product";
import { getStockStatus } from "@/lib/stock";

// Whole numbers without decimals: 390 AZN, but 12.5 -> 12.50 AZN
const money = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)} AZN`;

export function ProductPurchase({ productId, group, eyebrow, name, description, variants, id, onVariant }: { productId: string; group: string; eyebrow: string; name: string; description: string; variants: Variant[]; id: string; onVariant: (id: string) => void }) {
  const t = useTranslations("Product");
  const s = useTranslations("Stock");
  const [qty, setQty] = useState(1);
  const [added, flash] = useFlash();
  const { fav } = useStore();
  const isFav = fav.includes(productId);
  const cmp = useCompare(productId, group);
  const isCmp = cmp.on;
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
              <Chip key={x.id} selected={x.id === id} onClick={() => { onVariant(x.id); setQty(1); }}>{x.name}</Chip>
            ))}
          </div>
          <p className="text-[11px] text-muted">{t("variantNote")}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Quantity value={qty} max={max} onChange={setQty} decreaseLabel={t("decrease")} increaseLabel={t("increase")} />
        <Button variant={added ? "success" : "primary"} className="flex-1" onClick={() => { addToCart(v.id, qty); flash(); }}>
          <span key={String(added)} className="inline-flex animate-drop items-center gap-2.5">{added ? <><Check size={20} />{t("added")}</> : <><Plus size={20} />{t("addToCartFull")}</>}</span>
        </Button>
      </div>
      <div className="flex gap-3">
        <Button variant="bare" aria-pressed={isFav} onClick={() => toggleFav(productId)}
          className={`flex-1 hover:border-danger hover:text-danger ${isFav ? "border-danger bg-canvas text-danger" : "border-line bg-canvas text-ink"}`}>
          <Heart size={20} className={isFav ? "fill-danger text-danger" : ""} />{isFav ? t("favoriteOn") : t("favorite")}
        </Button>
        <Button variant="bare" aria-pressed={isCmp} onClick={cmp.toggle}
          className={`flex-1 hover:border-action hover:text-action ${isCmp ? "border-action bg-action-soft text-action" : "border-line bg-canvas text-ink"}`}>
          <Columns2 size={20} />{isCmp ? t("compareOn") : t("compare")}
        </Button>
      </div>
      {cmp.full && <p role="status" className="text-xs text-warn">{t("compareFull")}</p>}
      {cmp.ask && <ReplaceNotice group={group} onReplace={cmp.replace} onCancel={cmp.cancel} className="" />}

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
