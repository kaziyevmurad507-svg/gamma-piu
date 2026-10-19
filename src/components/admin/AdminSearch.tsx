"use client";
import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

// Live search: puts ?q=... into the address a moment after you stop typing (other filters stay), Enter searches at once
export function AdminSearch({ className }: { className?: string }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [value, setValue] = useState(sp.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const go = (q: string) => {
    const next = new URLSearchParams(sp.toString());
    if (q.trim()) next.set("q", q.trim()); else next.delete("q");
    router.replace(`${path}${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  const change = (v: string) => { setValue(v); clearTimeout(timer.current); timer.current = setTimeout(() => go(v), 300); };

  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); clearTimeout(timer.current); go(value); }}
      className={cn("flex h-[52px] items-center gap-2.5 rounded-card border border-line bg-canvas pl-[18px] pr-3 transition-colors focus-within:border-muted", className)}>
      <Search size={20} className="shrink-0 text-muted" />
      <input value={value} onChange={(e) => change(e.target.value)} placeholder="Название или SKU" aria-label="Поиск по товарам" autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none! placeholder:text-muted" />
      {value && <button type="button" aria-label="Очистить поиск" onClick={() => { change(""); clearTimeout(timer.current); go(""); }} className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-media hover:text-ink"><X size={16} /></button>}
    </form>
  );
}
