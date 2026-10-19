"use client";
import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ImagePlus, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { BUCKET } from "@/lib/admin-storage";
import type { AdminImage } from "@/lib/admin-data";
import { addImages, deleteImage, reorderImages, setMainImage } from "@/app/admin/(panel)/products/photo-actions";

type Group = { id: string | null; label: string; file: string }; // file = word used in the file name (Latin, from the SKU)
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_MB = 8;
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "photo";

// Photos of a product: a "common" group and one group per variant (color). Each group has its own upload button
export function PhotoManager({ productId, slug, images, groups }: { productId: string; slug: string; images: AdminImage[]; groups: Group[] }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const picker = useRef<HTMLInputElement>(null);
  const target = useRef<Group>(groups[0]); // group the open file dialog is for

  // Runs an action, shows its error (if any) and reloads the data
  const run = (job: () => Promise<{ error?: string } | void>) =>
    start(async () => {
      setError("");
      try { const r = await job(); if (r?.error) setError(r.error); } catch (e) { setError(e instanceof Error ? e.message : "Неизвестная ошибка"); }
      router.refresh();
    });

  const upload = async (files: File[], g: Group) => {
    setError("");
    const bad = files.find((f) => !TYPES[f.type] || f.size > MAX_MB * 1024 * 1024);
    if (bad) return setError(`«${bad.name}»: нужен JPG, PNG или WebP до ${MAX_MB} МБ`);
    const db = createClient();
    const saved: { path: string; variantId: string | null }[] = [];
    for (const [n, f] of files.entries()) {
      setStatus(`Загружаем ${n + 1} из ${files.length}…`);
      const path = `${slug}/${key(g.file)}-${Date.now()}-${n}.${TYPES[f.type]}`;
      const { error: e } = await db.storage.from(BUCKET).upload(path, f, { contentType: f.type });
      if (e) { setError(`Не удалось загрузить «${f.name}»: ${e.message}`); break; }
      saved.push({ path, variantId: g.id });
    }
    if (saved.length) {
      const r = await addImages(productId, saved);
      if (r.error) { setError(r.error); await db.storage.from(BUCKET).remove(saved.map((s) => s.path)); }
    }
    setStatus("");
    router.refresh();
  };

  // Swap a photo with its neighbour inside the same group, then save the order of all photos
  const move = (id: string, group: AdminImage[], d: -1 | 1) => {
    const a = group.findIndex((i) => i.id === id), b = a + d;
    if (b < 0 || b >= group.length) return;
    const ids = images.map((i) => i.id);
    const [x, y] = [ids.indexOf(group[a].id), ids.indexOf(group[b].id)];
    [ids[x], ids[y]] = [ids[y], ids[x]];
    run(() => reorderImages(ids));
  };

  const iconBtn = "grid size-8 place-items-center rounded-full bg-canvas/90 shadow-soft transition hover:text-action disabled:opacity-40";
  return (
    <section className="flex max-w-[860px] flex-col gap-6 rounded-bento border border-line p-5 lg:p-7">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-medium">Фото</h2>
        <p className="text-[13px] text-muted">Звезда = главное фото: его показывают карточки в каталоге. На странице товара сначала идут фото выбранного цвета, потом «Общие» (они видны при любом цвете). JPG, PNG или WebP до {MAX_MB} МБ.</p>
      </div>
      <input ref={picker} type="file" multiple hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) run(() => upload(f, target.current)); }} />
      {groups.map((g) => {
        const list = images.filter((i) => i.variantId === g.id);
        return (
          <div key={g.id ?? "common"} className="flex flex-col gap-3">
            <p className="text-sm font-medium">{g.label} <span className="font-normal text-muted">· {list.length}</span></p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((img) => (
                <div key={img.id} className={cn("relative aspect-square overflow-hidden rounded-card bg-media", img.isMain && "ring-2 ring-action")}>
                  <Image src={img.url} alt="" fill sizes="200px" className="object-contain p-2" />
                  <div className="absolute inset-x-2 bottom-2 flex items-center justify-between">
                    <button type="button" disabled={busy} aria-label="Сделать главным" onClick={() => run(() => setMainImage(productId, img.id))} className={cn(iconBtn, img.isMain && "text-action")}><Star size={16} fill={img.isMain ? "currentColor" : "none"} /></button>
                    <span className="flex gap-1">
                      <button type="button" disabled={busy} aria-label="Влево" onClick={() => move(img.id, list, -1)} className={iconBtn}><ChevronLeft size={16} /></button>
                      <button type="button" disabled={busy} aria-label="Вправо" onClick={() => move(img.id, list, 1)} className={iconBtn}><ChevronRight size={16} /></button>
                      <button type="button" disabled={busy} aria-label="Удалить фото" onClick={() => { if (confirm("Удалить это фото?")) run(() => deleteImage(img.id)); }} className={cn(iconBtn, "text-danger")}><Trash2 size={16} /></button>
                    </span>
                  </div>
                </div>
              ))}
              <button type="button" disabled={busy} onClick={() => { target.current = g; picker.current?.click(); }}
                className="grid aspect-square place-items-center rounded-card border border-dashed border-line text-[13px] text-muted transition-colors hover:border-action hover:text-action disabled:opacity-50">
                <span className="flex flex-col items-center gap-2"><ImagePlus size={22} />Добавить фото</span>
              </button>
            </div>
          </div>
        );
      })}
      {status && <p role="status" className="text-sm text-muted">{status}</p>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </section>
  );
}
