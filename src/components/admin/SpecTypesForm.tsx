"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2, Undo2 } from "lucide-react";
import { Button, btnClass } from "@/components/ui/Button";
import { StickyBar } from "@/components/admin/StickyBar";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type { SpecTypeRow } from "@/lib/admin-data";
import { saveSpecTypes } from "@/app/admin/(panel)/specs/actions";

// The list of characteristic types: key (used inside products), names in 3 languages, order of rows on the site
export function SpecTypesForm({ initial }: { initial: SpecTypeRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [base, setBase] = useState(initial); // last saved state, "Сбросить" goes back to it
  const dirty = JSON.stringify(rows) !== JSON.stringify(base);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pending, start] = useTransition();

  const setR = (i: number, patch: Partial<SpecTypeRow>) => setRows((p) => p.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: -1 | 1) => setRows((p) => { const n = [...p]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });
  const save = () => start(async () => {
    setMsg({});
    const r = await saveSpecTypes(rows);
    if (r.error) return setMsg({ error: r.error });
    const saved = rows.map((x) => ({ ...x, saved: true }));
    setRows(saved);
    setBase(saved);
    setMsg({ ok: "Сохранено" });
    router.refresh();
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="flex max-w-[860px] flex-col gap-4">
      {rows.map((r, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-card bg-media p-4 lg:flex-row lg:items-end">
          <div className="grid flex-1 gap-3 lg:grid-cols-4">
            {r.saved ? <p className="self-center text-[13px] text-muted">Ключ: <span className="text-ink">{r.key}</span></p>
              : <Input label="Ключ" required placeholder="battery_life" value={r.key} onChange={(e) => setR(i, { key: e.target.value })} />}
            <Input label="Название (AZ)" required value={r.label_az} onChange={(e) => setR(i, { label_az: e.target.value })} />
            <Input label="RU" value={r.label_ru} onChange={(e) => setR(i, { label_ru: e.target.value })} />
            <Input label="EN" value={r.label_en} onChange={(e) => setR(i, { label_en: e.target.value })} />
          </div>
          <div className="flex gap-1 self-end">
            <button type="button" disabled={i === 0} aria-label="Выше" onClick={() => move(i, -1)} className="grid size-11 place-items-center transition-colors hover:text-action disabled:opacity-30"><ArrowUp size={18} /></button>
            <button type="button" disabled={i === rows.length - 1} aria-label="Ниже" onClick={() => move(i, 1)} className="grid size-11 place-items-center transition-colors hover:text-action disabled:opacity-30"><ArrowDown size={18} /></button>
            <button type="button" aria-label="Удалить" onClick={() => { if (!r.saved || confirm("Удалить тип? Значения в товарах останутся, но подпись пропадёт.")) setRows((p) => p.filter((_, j) => j !== i)); }} className="grid size-11 place-items-center text-danger transition-opacity hover:opacity-70"><Trash2 size={18} /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setRows((p) => [...p, { key: "", label_az: "", label_ru: "", label_en: "", saved: false }])} className={cn(btnClass("secondary"), "self-start")}><Plus size={18} />Добавить тип</button>
      <StickyBar>
        <Button type="submit" disabled={pending}>{pending ? "Сохраняем…" : "Сохранить"}</Button>
        <button type="button" disabled={!dirty || pending} onClick={() => { setRows(base); setMsg({}); }} className={btnClass("secondary")}><Undo2 size={18} />Сбросить изменения</button>
        {msg.ok && <p role="status" className="text-sm text-ok">{msg.ok}</p>}
        {msg.error && <p role="alert" className="basis-full text-center text-sm text-danger">{msg.error}</p>}
      </StickyBar>
    </form>
  );
}
