"use client";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Select } from "@/components/ui/Select";
import { useCategories } from "@/components/layout/CategoriesProvider";
import { COLORS, SORTS } from "@/lib/categories";
import { useModalFocus } from "@/lib/use-modal-focus";

export type Values = { q: string; cats: string[]; min: string; max: string; avail: string[]; colors: string[]; sort: string };

const SWATCH: Record<(typeof COLORS)[number], string> = {
  black: "bg-scrim", grey: "bg-[#8b8d96]", silver: "bg-[#c9cad0]", gold: "bg-[#d4af37]", rose: "bg-[#e0a899]", pink: "bg-[#f4a6c0]",
  red: "bg-[#d93a3a]", violet: "bg-[#8a5cd6]", blue: "bg-action-fill", green: "bg-[#3fae6a]", orange: "bg-[#f28c28]",
};
const box = "checkbox size-[18px] shrink-0 appearance-none rounded-md border border-line bg-canvas";
const field = "field-hover h-[52px] w-full min-w-0 rounded-card border border-line bg-canvas px-[18px] text-sm";
const row = "flex cursor-pointer items-center gap-2.5 text-[13px] transition-colors hover:text-action has-checked:text-action";

function Check({ name, value, label, on, onChange }: { name: string; value: string; label: string; on: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={row}>
      <input type="checkbox" name={name} value={value} checked={on} onChange={(event) => onChange(event.target.checked)} className={box} />
      {label}
    </label>
  );
}

// One <form> wraps search, filters, sort and results. Any change updates the URL.
export function CatalogForm({ v, count, children }: { v: Values; count: number; children: ReactNode }) {
  const t = useTranslations();
  const c = useTranslations("Catalog");
  const cats = useCategories().filter((x) => !x.hidden);
  const router = useRouter();
  const pathname = usePathname();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [open, setOpen] = useState(false); // mobile filter sheet
  const source = JSON.stringify(v);
  const [state, setState] = useState({ source, submitted: "", values: v, navigation: 0 });
  // Preserve newer typing when our own request completes. External navigation restores the URL's values.
  if (state.source !== source) {
    const ownRequest = state.submitted === source;
    setState({ source, submitted: "", values: ownRequest ? state.values : v, navigation: state.navigation + (ownRequest ? 0 : 1) });
  }
  const draft = state.values;
  const sheet = useRef<HTMLElement>(null);
  const sheetId = useId();
  const closeSheet = useCallback(() => setOpen(false), [setOpen]);
  useModalFocus(open, sheet, closeSheet);

  // A resize back to the desktop sidebar must release modal focus and page scroll.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (desktop.matches) closeSheet(); };
    desktop.addEventListener("change", onResize);
    return () => desktop.removeEventListener("change", onResize);
  }, [closeSheet]);
  useEffect(() => { clearTimeout(timer.current); }, [state.navigation]);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Debounce typing; submit checkbox and sort changes immediately.
  const submit = (values: Values, delay = 0) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const p = new URLSearchParams();
      for (const key of ["q", "min", "max"] as const) if (values[key]) p.set(key, values[key]);
      for (const [key, entries] of [["cat", values.cats], ["avail", values.avail], ["color", values.colors]] as const) {
        for (const entry of entries) p.append(key, entry);
      }
      if (values.sort !== "recommended") p.set("sort", values.sort);
      setState((current) => ({ ...current, submitted: JSON.stringify(values) }));
      router.replace(p.size ? `${pathname}?${p}` : pathname, { scroll: false });
    }, delay);
  };

  const change = (updates: Partial<Values>, delay = 0) => {
    const values = { ...draft, ...updates };
    setState((current) => ({ ...current, values }));
    submit(values, delay);
  };
  const toggle = (field: "cats" | "avail" | "colors", value: string, checked: boolean) =>
    change({ [field]: checked ? [...draft[field], value] : draft[field].filter((entry) => entry !== value) });

  const reset = () => change({ q: "", cats: [], min: "", max: "", avail: [], colors: [], sort: "recommended" });

  // Any filter set? (sorting is not a filter)
  const active = Boolean(draft.q || draft.min || draft.max || draft.cats.length || draft.avail.length || draft.colors.length);
  const resetBtn = (
    <button type="button" onClick={reset} className="group inline-flex h-10 w-fit items-center gap-2 rounded-full border border-action bg-action-soft px-4 text-[13px] font-semibold text-action transition duration-150 hover:bg-action-fill hover:text-white active:scale-95">
      <RotateCcw size={16} className="transition-transform duration-300 group-hover:-rotate-180" />{c("reset")}
    </button>
  );

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(e) => { e.preventDefault(); submit(draft); }}
    >
      <div className="relative">
        <Search size={20} className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-1/2 text-muted" />
        <input type="search" name="q" value={draft.q} maxLength={80} onChange={(event) => change({ q: event.target.value }, 400)} placeholder={c("searchPlaceholder")} aria-label={c("searchPlaceholder")} className={`${field} pl-12`} />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/* Sidebar on desktop, full-screen sheet on mobile */}
        <aside ref={sheet} id={sheetId} role={open ? "dialog" : undefined} aria-modal={open || undefined} aria-labelledby={`${sheetId}-title`} tabIndex={-1} className={`${open ? "fixed inset-0 z-50 flex animate-rise" : "hidden"} flex-col gap-6 overflow-y-auto overscroll-contain bg-canvas p-5 lg:static lg:flex lg:w-60 lg:shrink-0 lg:gap-[26px] lg:rounded-card lg:bg-media lg:p-6`}>
          <div className="flex items-center justify-between">
            <h2 id={`${sheetId}-title`} className="text-xl font-semibold">{c("filters")}</h2>
            <SlidersHorizontal size={20} className="hidden lg:block" />
            <button type="button" aria-label={t("Nav.close")} onClick={closeSheet} className="photo-btn grid size-11 place-items-center lg:hidden"><X size={24} /></button>
          </div>
          {active && resetBtn}

          <div className="flex flex-col gap-4">
            <p className="text-[13px] font-semibold">{c("category")}</p>
            <label className={row}>
              <input type="checkbox" checked={!draft.cats.length} onChange={() => change({ cats: [] })} className={box} />{c("all")}
            </label>
            {cats.map((x) => <Check key={x.slug} name="cat" value={x.slug} label={x.name} on={draft.cats.includes(x.slug)} onChange={(checked) => toggle("cats", x.slug, checked)} />)}
          </div>

          <div className="flex flex-col gap-3.5">
            <p className="text-[13px] font-semibold">{c("price")}</p>
            <div className="flex gap-2">
              <input type="number" name="min" min={0} value={draft.min} onChange={(event) => change({ min: event.target.value }, 400)} placeholder={c("min")} aria-label={c("min")} className={field} />
              <input type="number" name="max" min={0} value={draft.max} onChange={(event) => change({ max: event.target.value }, 400)} placeholder={c("max")} aria-label={c("max")} className={field} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-[13px] font-semibold">{c("availability")}</p>
            <Check name="avail" value="stock" label={c("inStock")} on={draft.avail.includes("stock")} onChange={(checked) => toggle("avail", "stock", checked)} />
            <Check name="avail" value="order" label={c("onOrder")} on={draft.avail.includes("order")} onChange={(checked) => toggle("avail", "order", checked)} />
          </div>

          <div className="flex flex-col gap-3.5">
            <p className="text-[13px] font-semibold">{c("color")}</p>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((k) => (
                <label key={k} title={t(`Colors.${k}`)}>
                  <input type="checkbox" name="color" value={k} checked={draft.colors.includes(k)} onChange={(event) => toggle("colors", k, event.target.checked)} className="peer sr-only" />
                  <span className={`block size-7 cursor-pointer rounded-full border-[3px] border-canvas ring-1 ring-line transition duration-150 hover:scale-110 hover:ring-action peer-checked:ring-2 peer-checked:ring-action peer-focus-visible:ring-2 ${SWATCH[k]}`} />
                  <span className="sr-only">{t(`Colors.${k}`)}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="button" onClick={closeSheet} className="sticky bottom-0 mt-auto min-h-12 shrink-0 rounded-full bg-action-fill px-4 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-action-fill-hover active:scale-[0.98] lg:hidden">
            {c("showResults", { count })}
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls={sheetId} onClick={() => setOpen(true)} className="flex h-12 items-center gap-2.5 rounded-full border border-line px-[22px] text-sm font-semibold transition duration-150 hover:border-action hover:text-action active:scale-95 lg:hidden">
              <SlidersHorizontal size={20} />{c("filters")}
            </button>
            <p className="hidden text-[13px] text-muted lg:block">{c("showing", { count })}</p>
            {active && <span className="hidden lg:block">{resetBtn}</span>}
            <input type="hidden" name="sort" value={draft.sort} />
            <Select value={draft.sort} onChange={(sort) => change({ sort })} label={c("sortBy")} options={SORTS.map((s) => ({ value: s, label: c(`sort.${s}`) }))} />
          </div>
          {children}
        </div>
      </div>
    </form>
  );
}
