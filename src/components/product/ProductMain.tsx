"use client";
import { useState } from "react";
import { ProductGallery } from "./ProductGallery";
import { ProductPurchase } from "./ProductPurchase";
import type { ProductImage, Variant } from "@/lib/product";

type Props = { productId: string; group: string; eyebrow: string; name: string; description: string; variants: Variant[]; images: ProductImage[] };

// Holds the chosen variant, so the photos change together with the color
export function ProductMain({ images, name, ...rest }: Props) {
  const [id, setId] = useState(rest.variants[0].id);
  // Photos of the chosen color only; if it has none, the common photos
  const own = images.filter((i) => i.variantId === id);
  const shown = (own.length ? own : images.filter((i) => !i.variantId)).map((i) => i.url);

  return (
    <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:gap-16">
      {/* key = restart the gallery from the first photo when the color changes */}
      <div className="lg:w-[624px] lg:shrink-0"><ProductGallery key={id} images={shown} name={name} /></div>
      <div className="min-w-0 flex-1">
        <ProductPurchase {...rest} name={name} id={id} onVariant={setId} />
      </div>
    </div>
  );
}
