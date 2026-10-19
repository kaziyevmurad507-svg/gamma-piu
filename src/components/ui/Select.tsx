"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type Option = { value: string; label: string };

// Dropdown in the site style (the browser's own list cannot be styled). Works with mouse, touch and keyboard.
export function Select({ value, onChange, options, label, prefix, className }: {
  value: string; onChange: (v: string) => void; options: Option[]; label: string; prefix?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0); // highlighted option while the list is open
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const cur = Math.max(0, options.findIndex((o) => o.value === value));

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  // Keep the highlighted option visible when the list is long (keyboard arrows)
  useEffect(() => { if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" }); }, [open, active]);

  const show = () => { setActive(cur); setOpen(true); };
  const choose = (i: number) => { onChange(options[i].value); setOpen(false); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) show();
      else setActive((active + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    } else if ((e.key === "Enter" || e.key === " ") && open) {
      e.preventDefault();
      choose(active);
    }
  };

  return (
    <div ref={box} className={cn("relative", className)}>
      <button type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={() => (open ? setOpen(false) : show())} onKeyDown={onKey}
        className="flex h-11 items-center gap-2 rounded-full bg-media pl-4 pr-3.5 text-[13px] transition duration-150 hover:bg-action-soft hover:text-action active:scale-[0.98]">
        {prefix && <span className="hidden text-muted lg:inline">{prefix}:</span>}
        <span className="font-medium">{options[cur].label}</span>
        <ChevronDown size={16} aria-hidden className={cn("transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <ul ref={list} id={id} role="listbox" aria-label={label} className="absolute right-0 z-30 mt-2 animate-drop flex max-h-72 w-max min-w-full flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-card border border-line bg-canvas p-1.5 shadow-soft">
          {options.map((o, i) => (
            <li key={o.value} role="option" aria-selected={o.value === value} onMouseEnter={() => setActive(i)} onClick={() => choose(i)}
              className={cn("flex cursor-pointer items-center gap-3 rounded-panel px-3.5 py-2.5 text-[13px] transition-colors", i === active && "bg-action-soft text-action", o.value === value && "font-semibold")}>
              <span className="flex-1">{o.label}</span>
              {o.value === value && <Check size={16} aria-hidden className="text-action" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
