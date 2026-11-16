import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StockBadge } from "@/components/ui/StockBadge";
import { getStockStatus } from "@/lib/stock";
import type { Product } from "@/lib/catalog";
import { AddToCartButton, CompareButton, FavoriteButton } from "./ProductActions";

// wide = one card per row on mobile (favorites), with a taller photo.
export function ProductCard({ p, wide = false }: { p: Product; wide?: boolean }) {
  const t = useTranslations();
  // Show color only if we have a translation for it
  const color = p.color && t.has(`Colors.${p.color}`) ? ` · ${t(`Colors.${p.color}`)}` : "";
  const status = getStockStatus(p.stock);
  const href = `/product/${p.slug}?variant=${p.variantId}`;
  return (
    <article className="@container group flex min-w-0 animate-rise flex-col gap-2.5 self-start">
      <div className="relative">
        <Link href={href} tabIndex={-1} aria-hidden className={`relative block overflow-hidden rounded-card border border-line bg-white ${wide ? "h-[268px]" : "aspect-square lg:aspect-auto lg:h-[268px]"}`}>
          <span className="absolute inset-y-3 left-3 right-16">
            {p.image && <Image src={p.image} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-contain" />}
          </span>
        </Link>
        <FavoriteButton id={p.id} />
        <CompareButton id={p.id} group={p.group} />
      </div>
      <div className="flex min-w-0 flex-col gap-2 px-1">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-[11px] leading-4 text-muted" title={`${p.categoryName}${color}`}>{p.categoryName}{color}</p>
          <Link href={href} title={p.name} className="line-clamp-3 w-full wrap-anywhere text-[15px] leading-5 font-semibold transition-colors hover:text-action lg:text-lg lg:leading-6">{p.name}</Link>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-1.5">
          <StockBadge status={status} label={t(`Stock.${status}`)} compact />
          <p className="shrink-0 whitespace-nowrap text-base leading-6 font-semibold @min-[200px]:text-xl">{p.price} AZN</p>
        </div>
        <AddToCartButton id={p.variantId} stock={p.stock} className="w-full min-w-0 [&>span]:min-w-0 [&>span]:justify-center [&>span]:leading-tight [&>span>svg]:shrink-0" />
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
