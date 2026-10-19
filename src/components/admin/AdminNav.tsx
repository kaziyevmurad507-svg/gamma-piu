"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2x2, LayoutDashboard, ListChecks, Package } from "lucide-react";
import { cn } from "@/lib/cn";

// Add a line here when a new admin page appears (products, categories...)
const ITEMS = [
  { href: "/admin", label: "Обзор", Icon: LayoutDashboard },
  { href: "/admin/products", label: "Товары", Icon: Package },
  { href: "/admin/categories", label: "Категории", Icon: Grid2x2 },
  { href: "/admin/specs", label: "Характеристики", Icon: ListChecks },
];

const active = (path: string, href: string) => (href === "/admin" ? path === href : path === href || path.startsWith(`${href}/`));

// Desktop: left menu. Mobile: row of pills under the top bar
export function AdminNav() {
  const path = usePathname();
  return (
    <>
      <nav className="hidden flex-col gap-2 lg:flex">
        {ITEMS.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={cn("flex h-12 items-center gap-3 rounded-card px-4 text-[13px] transition-colors", active(path, href) ? "bg-action-soft font-semibold text-action" : "hover:bg-media")}>
            <Icon size={18} />{label}
          </Link>
        ))}
      </nav>
      <nav className="flex gap-2 overflow-x-auto lg:hidden">
        {ITEMS.map(({ href, label }) => (
          <Link key={href} href={href} className={cn("flex h-11 shrink-0 items-center rounded-full px-4 text-[13px]", active(path, href) ? "bg-action-soft font-semibold text-action" : "bg-media")}>{label}</Link>
        ))}
      </nav>
    </>
  );
}

// "Рабочая область / Обзор" in the top bar
export function AdminCrumb() {
  const path = usePathname();
  const page = ITEMS.find((i) => active(path, i.href))?.label ?? "";
  return <p className="hidden text-[15px] lg:block">Рабочая область{page && ` / ${page}`}</p>;
}
