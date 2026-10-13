import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StockBadge } from "@/components/ui/StockBadge"; // ASSUMED: <StockBadge stock={number} />
import type { Product } from "@/lib/catalog";
import { AddToCartButton, FavoriteButton } from "./ProductActions";

export function ProductCard({ p }: { p: Product }) {
  const t = useTranslations();
  // Show color only if we have a translation for it
  const color = p.color && t.has(`Colors.${p.color}`) ? ` · ${t(`Colors.${p.color}`)}` : "";
  const href = `/product/${p.slug}`; // product page comes in step 5
  return (
    <article className="flex min-w-0 flex-col gap-3">
      <div className="relative">
        <Link href={href} tabIndex={-1} aria-hidden className="relative block h-[184px] rounded-card bg-media lg:h-[268px]">
          {p.image && <Image src={p.image} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-contain p-5" />}
        </Link>
        <FavoriteButton id={p.id} />
      </div>
      <div className="flex flex-col items-start gap-1.5 px-1">
        <p className="text-xs text-muted">{t(`Categories.${p.category}`)}{color}</p>
        <Link href={href} className="text-[15px] font-semibold lg:text-lg">{p.name}</Link>
        <StockBadge stock={p.stock} />
        <div className="mt-1.5 flex w-full flex-col gap-2.5 lg:flex-row lg:items-center">
          <p className="text-[19px] font-semibold lg:flex-1 lg:text-[22px]">{p.price} AZN</p>
          <AddToCartButton id={p.id} />
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
