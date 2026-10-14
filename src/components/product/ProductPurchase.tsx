"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Columns2, Heart, Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Quantity } from "@/components/ui/Quantity";
import { StockBadge } from "@/components/ui/StockBadge";
import type { Variant } from "@/lib/product";
import { getStockStatus } from "@/lib/stock";

// Whole numbers without decimals: 390 AZN, but 12.5 -> 12.50 AZN
const money = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)} AZN`;

export function ProductPurchase({ eyebrow, name, description, variants }: { eyebrow: string; name: string; description: string; variants: Variant[] }) {
  const t = useTranslations("Product");
  const s = useTranslations("Stock");
  const [id, setId] = useState(variants[0].id);
  const [qty, setQty] = useState(1);
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

      {/* Cart, favorites and compare get real logic in step 6 */}
      <div className="flex gap-3">
        <Quantity value={qty} max={max} onChange={setQty} decreaseLabel={t("decrease")} increaseLabel={t("increase")} />
        <Button className="flex-1"><Plus size={20} />{t("addToCartFull")}</Button>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1"><Heart size={20} />{t("favorite")}</Button>
        <Button variant="secondary" className="flex-1"><Columns2 size={20} />{t("compare")}</Button>
      </div>

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
