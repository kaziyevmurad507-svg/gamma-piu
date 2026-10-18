"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/cn";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const t = useTranslations("Product");
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const strip = useRef<HTMLDivElement>(null);
  const many = images.length > 1;
  const go = (d: number) => setI((n) => (n + d + images.length) % images.length); // wraps around

  // Zoom view: Escape closes, arrow keys switch photos
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Keep the chosen thumbnail visible inside the scrolling strip
  useEffect(() => {
    const el = strip.current?.children[i] as HTMLElement | undefined;
    if (el && strip.current) strip.current.scrollTo({ left: el.offsetLeft - (strip.current.clientWidth - el.clientWidth) / 2, behavior: "smooth" });
  }, [i]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[360px] rounded-card border border-line bg-canvas lg:h-[580px]">
        {images[i] && <Image src={images[i]} alt={name} fill priority sizes="(min-width:1024px) 624px, 100vw" className="object-contain p-3" />}
        {many && ([-1, 1] as const).map((d) => (
          <button key={d} type="button" aria-label={t(d < 0 ? "prevImage" : "nextImage")} onClick={() => go(d)}
            className={cn("photo-btn absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-action-soft text-action", d < 0 ? "left-5" : "right-5")}>
            {d < 0 ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        ))}
        {images[i] && (
          <button type="button" aria-label={t("zoom")} onClick={() => setZoom(true)} className="photo-btn absolute bottom-5 right-5 grid size-11 place-items-center rounded-full bg-action-soft text-action">
            <Maximize2 size={20} />
          </button>
        )}
      </div>

      {many && (
        <div ref={strip} className="relative flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {images.map((src, n) => (
            <button key={src} type="button" aria-label={t("imageN", { n: n + 1 })} aria-current={n === i} onClick={() => setI(n)}
              className={cn("w-[calc((100%-36px)/4)] shrink-0 rounded-card border-2 p-1 transition-colors duration-150 hover:border-action", n === i ? "border-action" : "border-transparent")}>
              <span className="relative block h-[82px] rounded-panel border border-line bg-canvas lg:h-[122px]">
                <Image src={src} alt="" fill sizes="150px" className="object-contain p-1" />
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
