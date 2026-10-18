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
  const href = `/product/${p.slug}`; // product page comes in step 5
  return (
    <article className="group flex min-w-0 animate-rise flex-col gap-3">
      <div className="relative">
        <Link href={href} tabIndex={-1} aria-hidden className={`relative block overflow-hidden rounded-card border border-line bg-canvas ${wide ? "h-[268px]" : "h-[184px] lg:h-[268px]"}`}>
          {p.image && <Image src={p.image} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-contain p-5 transition-transform duration-300 group-hover:scale-105" />}
        </Link>
        <FavoriteButton id={p.id} />
        <CompareButton id={p.id} category={p.category} />
      </div>
      <div className="flex flex-col items-start gap-1.5 px-1">
        <p className="text-xs text-muted">{t(`Categories.${p.category}`)}{color}</p>
        <Link href={href} className="text-[15px] font-semibold transition-colors hover:text-action lg:text-lg">{p.name}</Link>
        <StockBadge status={status} label={t(`Stock.${status}`)} />
        <div className={`mt-1.5 flex w-full gap-2.5 ${wide ? "items-center" : "flex-col lg:flex-row lg:items-center"}`}>
          <p className={`font-semibold lg:flex-1 lg:text-[22px] ${wide ? "flex-1 text-[22px]" : "text-[19px]"}`}>{p.price} AZN</p>
          <AddToCartButton id={p.variantId} className={wide ? "w-auto" : undefined} />
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
