"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button, btnClass } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import type { ProductFormData, VariantFormData } from "@/lib/admin-data";
import { deleteProduct, saveProduct } from "@/app/admin/(panel)/products/actions";

type Option = { value: string; label: string };
const blankVariant = (): VariantFormData => ({ id: crypto.randomUUID(), sku: "", name_az: "", name_ru: "", name_en: "", price: "", stock: "10", is_active: true });
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const box = "flex flex-col gap-5 rounded-bento border border-line p-5 lg:p-7";
const area = "field-hover min-h-28 rounded-card border border-line bg-canvas p-[18px] text-sm placeholder:text-muted";

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="checkbox size-[18px] shrink-0 appearance-none rounded-md border border-line bg-canvas" />
      {label}
    </label>
  );
}

export function ProductForm({ initial, categories, brands }: { initial: ProductFormData; categories: Option[]; brands: Option[] }) {
  const router = useRouter();
  const [d, setD] = useState(() => (initial.id ? initial : { ...initial, variants: [blankVariant()] }));
  const [slugTouched, setSlugTouched] = useState(false); // stop filling the slug from the name once the user edits it
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pending, start] = useTransition();

  const set = <K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) => setD((p) => ({ ...p, [k]: v }));
  const setV = (i: number, patch: Partial<VariantFormData>) => set("variants", d.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const text = (k: "name_az" | "name_ru" | "name_en" | "description_az" | "description_ru" | "description_en") => ({ value: d[k], onChange: (e: { target: { value: string } }) => set(k, e.target.value) });

  const save = () =>
    start(async () => {
      setMsg({});
      const r = await saveProduct(d);
      if ("error" in r) return setMsg({ error: r.error });
      if (!d.id) return router.push(`/admin/products/${r.id}`);
      setMsg({ ok: "Сохранено" });
      router.refresh();
    });

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="flex max-w-[860px] flex-col gap-6">
      <section className={box}>
        <h2 className="text-xl font-medium">Основное</h2>
        <Input label="Название (AZ)" required {...text("name_az")} />
        <div className="grid gap-5 lg:grid-cols-2">
          <Input label="Название (RU)" {...text("name_ru")} />
          <Input label="Название (EN)" {...text("name_en")} onChange={(e) => { set("name_en", e.target.value); if (!d.id && !slugTouched) set("slug", slugify(e.target.value)); }} />
        </div>
        {d.id ? (
          <p className="text-[13px] text-muted">Адрес (slug): <span className="text-ink">{d.slug}</span> · после создания не меняется (по нему называется папка фото)</p>
        ) : (
          <Input label="Адрес (slug)" required placeholder="gamma-boosted" value={d.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
        )}
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Категория</span>
            <Select label="Категория" value={d.category_id} onChange={(v) => set("category_id", v)} options={[{ value: "", label: "Выберите…" }, ...categories]} className="[&_ul]:left-0 [&_ul]:right-auto" /></div>
          <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Бренд</span>
            <Select label="Бренд" value={d.brand_id} onChange={(v) => set("brand_id", v)} options={[{ value: "", label: "Без бренда" }, ...brands]} className="[&_ul]:left-0 [&_ul]:right-auto" /></div>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Check label="Опубликован на сайте" checked={d.is_published} onChange={(v) => set("is_published", v)} />
          <Check label="Новинка" checked={d.is_new} onChange={(v) => set("is_new", v)} />
          <Check label="Рекомендуемый (главная)" checked={d.is_featured} onChange={(v) => set("is_featured", v)} />
        </div>
      </section>

      <section className={box}>
        <h2 className="text-xl font-medium">Описание</h2>
        {(["az", "ru", "en"] as const).map((l) => (
          <label key={l} className="flex flex-col gap-2 text-[13px] font-medium">Описание ({l.toUpperCase()})<textarea className={cn(area, "font-normal")} {...text(`description_${l}`)} /></label>
        ))}
      </section>

      <section className={box}>
        <h2 className="text-xl font-medium">Варианты (цвета, комплектации)</h2>
        {d.variants.map((v, i) => (
          <div key={v.id} className="flex flex-col gap-4 rounded-card bg-media p-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <Input label="SKU" required value={v.sku} onChange={(e) => setV(i, { sku: e.target.value })} />
              <Input label="Цена, AZN" required type="number" min="0" step="0.01" inputMode="decimal" value={v.price} onChange={(e) => setV(i, { price: e.target.value })} />
              <Input label="Склад, шт. (0 = нет в наличии)" required type="number" min="0" step="1" inputMode="numeric" value={v.stock} onChange={(e) => setV(i, { stock: e.target.value })} />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Input label="Название варианта (AZ)" placeholder="Qara" value={v.name_az} onChange={(e) => setV(i, { name_az: e.target.value })} />
              <Input label="Название (RU)" placeholder="Чёрный" value={v.name_ru} onChange={(e) => setV(i, { name_ru: e.target.value })} />
              <Input label="Название (EN)" placeholder="Black" value={v.name_en} onChange={(e) => setV(i, { name_en: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Check label="Продаётся (активен)" checked={v.is_active} onChange={(a) => setV(i, { is_active: a })} />
              <button type="button" onClick={() => { if (confirm("Удалить вариант? Его фото тоже удалятся.")) set("variants", d.variants.filter((_, j) => j !== i)); }}
                className="inline-flex items-center gap-1.5 text-[13px] text-danger transition-opacity hover:opacity-70"><Trash2 size={16} />Удалить</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => set("variants", [...d.variants, blankVariant()])} className={cn(btnClass("secondary"), "self-start")}><Plus size={18} />Добавить вариант</button>
        {!d.variants.some((v) => v.is_active) && <p className="text-xs text-warn">Нет активных вариантов: на сайте товар не будет виден.</p>}
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>{pending ? "Сохраняем…" : "Сохранить"}</Button>
        <Link href="/admin/products" className={btnClass("secondary")}>К списку</Link>
        {d.id && (
          <button type="button" disabled={pending} onClick={() => { if (confirm("Удалить товар вместе с вариантами? Это нельзя отменить.")) start(() => deleteProduct(d.id!)); }}
            className="ml-auto inline-flex items-center gap-1.5 text-[13px] text-danger transition-opacity hover:opacity-70"><Trash2 size={16} />Удалить товар</button>
        )}
      </div>
      {msg.error && <p role="alert" className="text-sm text-danger">{msg.error}</p>}
      {msg.ok && <p role="status" className="text-sm text-ok">{msg.ok}</p>}
    </form>
  );
}
