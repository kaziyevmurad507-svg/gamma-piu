"use client";
import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, Undo2 } from "lucide-react";
import { Button, btnClass } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StickyBar } from "@/components/admin/StickyBar";
import { cn } from "@/lib/cn";
import { BUCKET } from "@/lib/admin-storage";
import { createClient } from "@/lib/supabase/client";
import type { AmbassadorRow } from "@/lib/admin-data";
import { saveAmbassadors } from "@/app/admin/(panel)/ambassadors/actions";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_MB = 8;
const blank: AmbassadorRow = { id: null, name: "", role_az: "", role_ru: "", role_en: "", instagram: "", image_path: "", image_url: "", is_published: true };

// Ambassadors: photo, name, caption (az/ru/en), Instagram, shown flag, order. Deleting happens on Save (and "Сбросить" brings it back)
export function AmbassadorsForm({ initial }: { initial: AmbassadorRow[] }) {
  const [rows, setRows] = useState(initial);
  const [base, setBase] = useState(initial); // last saved state
  const [removed, setRemoved] = useState<string[]>([]); // ids of saved ambassadors deleted in the form
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [busy, setBusy] = useState(false); // photo is uploading
  const [pending, start] = useTransition();
  const picker = useRef<HTMLInputElement>(null);
  const target = useRef(0); // row whose photo is being picked
  const dirty = removed.length > 0 || JSON.stringify(rows) !== JSON.stringify(base);

  const setR = (i: number, patch: Partial<AmbassadorRow>) => setRows((p) => p.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: -1 | 1) => setRows((p) => { const n = [...p]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });
  const remove = (i: number) => {
    const r = rows[i];
    if (r.id) {
      if (!confirm(`Удалить амбассадора «${r.name}»? Удаление произойдёт после нажатия «Сохранить».`)) return;
      setRemoved((p) => [...p, r.id!]);
    }
    setRows((p) => p.filter((_, j) => j !== i));
  };
  const reset = () => { setRows(base); setRemoved([]); setMsg({}); };

  // Photo goes straight from the browser to Storage; the row only remembers the path until Save
  const upload = async (file: File, i: number) => {
    if (!TYPES[file.type] || file.size > MAX_MB * 1024 * 1024) return setMsg({ error: `«${file.name}»: нужен JPG, PNG или WebP до ${MAX_MB} МБ` });
    setMsg({});
    setBusy(true);
    const db = createClient();
    const path = `ambassadors/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${TYPES[file.type]}`;
    const { error } = await db.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    setBusy(false);
    if (error) return setMsg({ error: `Не удалось загрузить фото: ${error.message}` });
    setR(i, { image_path: path, image_url: db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl });
  };

  const save = () => start(async () => {
    setMsg({});
    const r = await saveAmbassadors(rows, removed);
    if ("error" in r) return setMsg({ error: r.error });
    setRows(r.rows);
    setBase(r.rows);
    setRemoved([]);
    setMsg({ ok: "Сохранено" });
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="flex max-w-[860px] flex-col gap-4">
      <input ref={picker} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f, target.current); }} />
      {rows.map((r, i) => (
        <div key={r.id ?? `new-${i}`} className="flex flex-col gap-4 rounded-card bg-media p-5 sm:flex-row">
          <button type="button" aria-label="Загрузить фото" onClick={() => { target.current = i; picker.current?.click(); }}
            className="relative grid h-[140px] w-[112px] shrink-0 place-items-center overflow-hidden rounded-panel border border-line bg-canvas text-muted transition-colors hover:border-action hover:text-action">
            {r.image_url ? <Image src={r.image_url} alt="" fill sizes="112px" className="object-cover" /> : <span className="flex flex-col items-center gap-1.5 text-xs"><ImagePlus size={22} />Фото</span>}
          </button>
          <div className="flex flex-1 flex-col gap-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Input label="Имя" required value={r.name} onChange={(e) => setR(i, { name: e.target.value })} />
              <Input label="Instagram" placeholder="@username или ссылка" value={r.instagram} onChange={(e) => setR(i, { instagram: e.target.value })} />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Input label="Подпись (AZ)" placeholder="Barber, Bakı" value={r.role_az} onChange={(e) => setR(i, { role_az: e.target.value })} />
              <Input label="RU" placeholder="Барбер, Баку" value={r.role_ru} onChange={(e) => setR(i, { role_ru: e.target.value })} />
              <Input label="EN" placeholder="Barber, Baku" value={r.role_en} onChange={(e) => setR(i, { role_en: e.target.value })} />
            </div>
            <div className="flex flex-wrap items-center gap-x-6">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input type="checkbox" checked={r.is_published} onChange={(e) => setR(i, { is_published: e.target.checked })} className="checkbox size-[18px] shrink-0 appearance-none rounded-md border border-line bg-canvas" />
                Показывать на сайте
              </label>
              <div className="ml-auto flex gap-1">
                <button type="button" disabled={i === 0} aria-label="Выше" onClick={() => move(i, -1)} className="grid size-11 place-items-center transition-colors hover:text-action disabled:opacity-30"><ArrowUp size={18} /></button>
                <button type="button" disabled={i === rows.length - 1} aria-label="Ниже" onClick={() => move(i, 1)} className="grid size-11 place-items-center transition-colors hover:text-action disabled:opacity-30"><ArrowDown size={18} /></button>
                <button type="button" aria-label="Удалить" onClick={() => remove(i)} className="grid size-11 place-items-center text-danger transition-opacity hover:opacity-70"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setRows((p) => [...p, blank])} className={cn(btnClass("secondary"), "self-start")}><Plus size={18} />Добавить амбассадора</button>
      <StickyBar>
        <Button type="submit" disabled={pending || busy}>{pending ? "Сохраняем…" : busy ? "Загружаем фото…" : "Сохранить"}</Button>
        <button type="button" disabled={!dirty || pending} onClick={reset} aria-label="Сбросить изменения" className={btnClass("secondary")}><Undo2 size={18} /><span className="hidden sm:inline">Сбросить изменения</span></button>
        {removed.length > 0 && <p className="text-sm text-danger">К удалению: {removed.length}</p>}
        {msg.ok && <p role="status" className="text-sm text-ok">{msg.ok}</p>}
        {msg.error && <p role="alert" className="basis-full text-center text-sm text-danger">{msg.error}</p>}
      </StickyBar>
    </form>
  );
}
