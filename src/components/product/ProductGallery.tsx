"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/lib/cn";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const t = useTranslations("Product");
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);

  // Close the zoom view with the Escape key
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[360px] rounded-card bg-media lg:h-[580px]">
        {images[i] && <Image src={images[i]} alt={name} fill priority sizes="(min-width:1024px) 624px, 100vw" className="object-contain p-5" />}
        {images[i] && (
          <button type="button" aria-label={t("zoom")} onClick={() => setZoom(true)} className="photo-btn absolute bottom-5 right-5 grid size-11 place-items-center rounded-full bg-canvas shadow-soft">
            <Maximize2 size={20} />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.slice(0, 4).map((src, n) => (
            <button key={src} type="button" aria-label={t("imageN", { n: n + 1 })} aria-current={n === i} onClick={() => setI(n)}
              className={cn("rounded-card border-2 p-1 transition-colors duration-150 hover:border-action", n === i ? "border-action" : "border-transparent")}>
              <span className="relative block h-[82px] rounded-panel bg-media lg:h-[122px]">
                <Image src={src} alt="" fill sizes="150px" className="object-contain p-2" />
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="text-[11px] text-muted">{t("imageNote")}</p>

      {zoom && (
        <div role="dialog" aria-modal="true" onClick={() => setZoom(false)} className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-5">
          <button type="button" aria-label={t("closeZoom")} className="photo-btn absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-canvas"><X size={20} /></button>
          <div className="relative size-full max-w-5xl"><Image src={images[i]} alt={name} fill sizes="100vw" className="object-contain" /></div>
        </div>
      )}
    </div>
  );
}
