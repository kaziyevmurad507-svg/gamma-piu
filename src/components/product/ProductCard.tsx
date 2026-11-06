import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StockBadge } from "@/components/ui/StockBadge";
import { getStockStatus } from "@/lib/stock";
import type { Product } from "@/lib/catalog";
import { AddToCartButton, CompareButton, FavoriteButton } from "./ProductActions";

// wide = one card per row on mobile (favorites): taller photo, price and button on one line
export function ProductCard({ p, wide = false }: { p: Product; wide?: boolean }) {
  const t = useTranslations();
  // Show color only if we have a translation for it
  const color = p.color && t.has(`Colors.${p.color}`) ? ` · ${t(`Colors.${p.color}`)}` : "";
  const status = getStockStatus(p.stock);
  const href = `/product/${p.slug}?variant=${p.variantId}`;
  return (
    <article className="group flex h-full min-w-0 animate-rise flex-col gap-3">
      <div className="relative">
        <Link href={href} tabIndex={-1} aria-hidden className={`relative block overflow-hidden rounded-card border border-line bg-canvas ${wide ? "h-[268px]" : "aspect-square lg:aspect-auto lg:h-[268px]"}`}>
          {p.image && <Image src={p.image} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-contain p-5 transition-transform duration-300 group-hover:scale-105" />}
        </Link>
        <FavoriteButton id={p.id} />
        <CompareButton id={p.id} group={p.group} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 px-1">
        <p className="line-clamp-2 min-h-8 text-xs leading-4 text-muted" title={`${p.categoryName}${color}`}>{p.categoryName}{color}</p>
        <Link href={href} title={p.name} className="line-clamp-3 min-h-[60px] w-full wrap-anywhere text-[15px] leading-5 font-semibold transition-colors hover:text-action lg:line-clamp-2 lg:min-h-14 lg:text-lg lg:leading-7">{p.name}</Link>
        <StockBadge status={status} label={t(`Stock.${status}`)} />
        <div className={`mt-auto flex w-full gap-2.5 pt-1.5 ${wide ? "items-center" : "flex-col lg:flex-row lg:items-center"}`}>
          <p className={`font-semibold lg:flex-1 lg:text-[22px] ${wide ? "flex-1 text-[22px]" : "text-[19px]"}`}>{p.price} AZN</p>
          <AddToCartButton id={p.variantId} stock={p.stock} className={wide ? "w-auto" : undefined} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, className = "lg:grid-cols-4" }: { products: Product[]; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-x-3 gap-y-8 lg:gap-x-6 ${className}`}>
      {products.map((p) => <ProductCard key={p.id} p={p} />)}
    </div>
  );
}
