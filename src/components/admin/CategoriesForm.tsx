"use client";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, Undo2 } from "lucide-react";
import { Button, btnClass } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StickyBar } from "@/components/admin/StickyBar";
import { cn } from "@/lib/cn";
import type { CategoryRow } from "@/lib/admin-data";
import { saveCategories } from "@/app/admin/(panel)/categories/actions";

// Categories: names, order, hidden flag, "compare together with". Deleting happens on Save (and "Сбросить" brings it back)
export function CategoriesForm({ initial }: { initial: CategoryRow[] }) {
  const [rows, setRows] = useState(initial);
  const [base, setBase] = useState(initial); // last saved state
  const [removed, setRemoved] = useState<string[]>([]); // ids of saved categories deleted in the form
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pending, start] = useTransition();
  const dirty = removed.length > 0 || JSON.stringify(rows) !== JSON.stringify(base);

  const setR = (i: number, patch: Partial<CategoryRow>) => setRows((p) => p.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: -1 | 1) => setRows((p) => { const n = [...p]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });
  const remove = (i: number) => {
    const r = rows[i];
    if (r.id) {
      const text = r.products ? `В категории «${r.name_az}» товаров: ${r.products}. Они будут УДАЛЕНЫ вместе с фото. ` : "";
      if (!confirm(`${text}Удалить категорию «${r.name_az}»? Удаление произойдёт после нажатия «Сохранить».`)) return;
      setRemoved((p) => [...p, r.id!]);
    }
    setRows((p) => p.filter((_, j) => j !== i));
    // categories that were compared with the deleted one become standalone
    setRows((p) => p.map((x) => (x.compare_group === r.slug ? { ...x, compare_group: "" } : x)));
  };
  const reset = () => { setRows(base); setRemoved([]); setMsg({}); };
  const save = () => start(async () => {
    setMsg({});
    const r = await saveCategories(rows, removed);
    if ("error" in r) return setMsg({ error: r.error });
    setRows(r.rows);
    setBase(r.rows);
    setRemoved([]);
    setMsg({ ok: "Сохранено" });
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="flex max-w-[860px] flex-col gap-4">
      {rows.map((r, i) => (
        <div key={i} className="flex flex-col gap-4 rounded-card bg-media p-5">
          <div className="grid gap-4 lg:grid-cols-4">
            {r.id ? <p className="self-center text-[13px] text-muted">Адрес: <span className="text-ink">{r.slug}</span></p>
              : <Input label="Адрес (slug)" required placeholder="scissors" value={r.slug} onChange={(e) => setR(i, { slug: e.target.value })} />}
            <Input label="Название (AZ)" required value={r.name_az} onChange={(e) => setR(i, { name_az: e.target.value })} />
            <Input label="RU" value={r.name_ru} onChange={(e) => setR(i, { name_ru: e.target.value })} />
            <Input label="EN" value={r.name_en} onChange={(e) => setR(i, { name_en: e.target.value })} />
          </div>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <label className="flex cursor-pointer items-center gap-2.5 pb-3 text-sm">
              <input type="checkbox" checked={r.is_hidden} onChange={(e) => setR(i, { is_hidden: e.target.checked })} className="checkbox size-[18px] shrink-0 appearance-none rounded-md border border-line bg-canvas" />
              Скрыть (с товарами)
            </label>
            <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Сравнивать вместе с</span>
              <Select label="Сравнивать вместе с" value={r.compare_group} onChange={(v) => setR(i, { compare_group: v })} className="[&_ul]:left-0 [&_ul]:right-auto"
                options={[{ value: "", label: "Только свои товары" }, ...rows.filter((x) => x.slug && x.slug !== r.slug).map((x) => ({ value: x.slug, label: x.name_az || x.slug }))]} /></div>
            <p className="pb-3 text-[13px] text-muted">Товаров: {r.products}</p>
            <div className="ml-auto flex gap-1">
              <button type="button" disabled={i === 0} aria-label="Выше" onClick={() => move(i, -1)} className="grid size-11 place-items-center transition-colors hover:text-action disabled:opacity-30"><ArrowUp size={18} /></button>
              <button type="button" disabled={i === rows.length - 1} aria-label="Ниже" onClick={() => move(i, 1)} className="grid size-11 place-items-center transition-colors hover:text-action disabled:opacity-30"><ArrowDown size={18} /></button>
              <button type="button" aria-label="Удалить" onClick={() => remove(i)} className="grid size-11 place-items-center text-danger transition-opacity hover:opacity-70"><Trash2 size={18} /></button>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setRows((p) => [...p, { id: null, slug: "", name_az: "", name_ru: "", name_en: "", is_hidden: false, compare_group: "", products: 0 }])} className={cn(btnClass("secondary"), "self-start")}><Plus size={18} />Добавить категорию</button>
      <StickyBar>
        <Button type="submit" disabled={pending}>{pending ? "Сохраняем…" : "Сохранить"}</Button>
        <button type="button" disabled={!dirty || pending} onClick={reset} aria-label="Сбросить изменения" className={btnClass("secondary")}><Undo2 size={18} /><span className="hidden sm:inline">Сбросить изменения</span></button>
        {removed.length > 0 && <p className="text-sm text-danger">К удалению: {removed.length}</p>}
        {msg.ok && <p role="status" className="text-sm text-ok">{msg.ok}</p>}
        {msg.error && <p role="alert" className="basis-full text-center text-sm text-danger">{msg.error}</p>}
      </StickyBar>
    </form>
  );
}
