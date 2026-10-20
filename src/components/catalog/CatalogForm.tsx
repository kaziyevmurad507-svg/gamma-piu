"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Select } from "@/components/ui/Select";
import { useCategories } from "@/components/layout/CategoriesProvider";
import { COLORS, SORTS } from "@/lib/categories";

export type Values = { q: string; cats: string[]; min: string; max: string; avail: string[]; colors: string[]; sort: string };

const SWATCH: Record<(typeof COLORS)[number], string> = {
  black: "bg-scrim", grey: "bg-[#8b8d96]", silver: "bg-[#c9cad0]", gold: "bg-[#d4af37]", rose: "bg-[#e0a899]", pink: "bg-[#f4a6c0]",
  red: "bg-[#d93a3a]", violet: "bg-[#8a5cd6]", blue: "bg-action", green: "bg-[#3fae6a]", orange: "bg-[#f28c28]",
};
const box = "checkbox size-[18px] shrink-0 appearance-none rounded-md border border-line bg-canvas";
const field = "field-hover h-[52px] w-full min-w-0 rounded-card border border-line bg-canvas px-[18px] text-sm";
const row = "flex cursor-pointer items-center gap-2.5 text-[13px] transition-colors hover:text-action has-checked:text-action";

function Check({ name, value, label, on }: { name: string; value: string; label: string; on: boolean }) {
  return (
    <label className={row}>
      <input type="checkbox" name={name} value={value} defaultChecked={on} className={box} />
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
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [open, setOpen] = useState(false); // mobile filter sheet
  const [sort, setSort] = useState(v.sort); // value of the custom sort dropdown

  // Lock page scroll while the mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Copy form values into the URL; the server page re-renders with new results
  const submit = (delay = 0) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const p = new URLSearchParams();
      new FormData(form.current!).forEach((val, key) => {
        if (val !== "" && !(key === "sort" && val === "recommended")) p.append(key, String(val));
      });
      router.replace(p.size ? `${pathname}?${p}` : pathname, { scroll: false });
    }, delay);
  };

  const clearCats = () => {
    form.current!.querySelectorAll<HTMLInputElement>('input[name="cat"]').forEach((i) => (i.checked = false));
    submit();
  };

  const reset = () => {
    form.current!.querySelectorAll<HTMLInputElement>("input").forEach((i) => (i.type === "checkbox" ? (i.checked = false) : (i.value = "")));
    setSort("recommended");
    submit();
  };

  // Any filter set? (sorting is not a filter)
  const active = Boolean(v.q || v.min || v.max || v.cats.length || v.avail.length || v.colors.length);
  const resetBtn = (
    <button type="button" onClick={reset} className="group inline-flex h-10 w-fit items-center gap-2 rounded-full border border-action bg-action-soft px-4 text-[13px] font-semibold text-action transition duration-150 hover:bg-action hover:text-white active:scale-95">
      <RotateCcw size={16} className="transition-transform duration-300 group-hover:-rotate-180" />{c("reset")}
    </button>
  );

  return (
    <form
      ref={form}
      className="flex flex-col gap-8"
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      // Typing is debounced, checkboxes and select apply right away
      onChange={(e) => submit(["search", "number"].includes((e.target as unknown as HTMLInputElement).type) ? 400 : 0)}
    >
      <div className="relative">
        <Search size={20} className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-1/2 text-muted" />
        <input type="search" name="q" defaultValue={v.q} placeholder={c("searchPlaceholder")} aria-label={c("searchPlaceholder")} className={`${field} pl-12`} />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/* Sidebar on desktop, full-screen sheet on mobile */}
        <aside className={`${open ? "fixed inset-0 z-50 flex animate-rise" : "hidden"} flex-col gap-6 overflow-y-auto bg-canvas p-5 lg:static lg:flex lg:w-60 lg:shrink-0 lg:gap-[26px] lg:rounded-card lg:bg-media lg:p-6`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{c("filters")}</h2>
            <SlidersHorizontal size={20} className="hidden lg:block" />
            <button type="button" aria-label={t("Nav.close")} onClick={() => setOpen(false)} className="photo-btn lg:hidden"><X size={24} /></button>
          </div>
          {active && resetBtn}

          <div className="flex flex-col gap-4">
            <p className="text-[13px] font-semibold">{c("category")}</p>
            <label className={row}>
              <input type="checkbox" checked={!v.cats.length} onChange={clearCats} className={box} />{c("all")}
            </label>
            {cats.map((x) => <Check key={x.slug} name="cat" value={x.slug} label={x.name} on={v.cats.includes(x.slug)} />)}
          </div>

          <div className="flex flex-col gap-3.5">
            <p className="text-[13px] font-semibold">{c("price")}</p>
            <div className="flex gap-2">
              <input type="number" name="min" min={0} defaultValue={v.min} placeholder={c("min")} aria-label={c("min")} className={field} />
              <input type="number" name="max" min={0} defaultValue={v.max} placeholder={c("max")} aria-label={c("max")} className={field} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-[13px] font-semibold">{c("availability")}</p>
            <Check name="avail" value="stock" label={c("inStock")} on={v.avail.includes("stock")} />
            <Check name="avail" value="order" label={c("onOrder")} on={v.avail.includes("order")} />
          </div>

          <div className="flex flex-col gap-3.5">
            <p className="text-[13px] font-semibold">{c("color")}</p>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((k) => (
                <label key={k} title={t(`Colors.${k}`)}>
                  <input type="checkbox" name="color" value={k} defaultChecked={v.colors.includes(k)} className="peer sr-only" />
                  <span className={`block size-7 cursor-pointer rounded-full border-[3px] border-canvas ring-1 ring-line transition duration-150 hover:scale-110 hover:ring-action peer-checked:ring-2 peer-checked:ring-action peer-focus-visible:ring-2 ${SWATCH[k]}`} />
                  <span className="sr-only">{t(`Colors.${k}`)}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="button" onClick={() => setOpen(false)} className="sticky bottom-0 mt-auto h-12 rounded-full bg-action text-sm font-semibold text-canvas transition duration-150 hover:bg-action-hover active:scale-[0.98] lg:hidden">
            {c("showResults", { count })}
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setOpen(true)} className="flex h-12 items-center gap-2.5 rounded-full border border-line px-[22px] text-sm font-semibold transition duration-150 hover:border-action hover:text-action active:scale-95 lg:hidden">
              <SlidersHorizontal size={20} />{c("filters")}
            </button>
            <p className="hidden text-[13px] text-muted lg:block">{c("showing", { count })}</p>
            {active && <span className="hidden lg:block">{resetBtn}</span>}
            <input type="hidden" name="sort" value={sort} />
            <Select value={sort} onChange={(val) => { setSort(val); submit(); }} label={c("sortBy")} options={SORTS.map((s) => ({ value: s, label: c(`sort.${s}`) }))} />
          </div>
          {children}
        </div>
      </div>
    </form>
  );
}
