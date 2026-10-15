"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Columns2, Heart, Menu, Search, ShoppingBag, Truck, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useStore } from "@/lib/store";
import { LocaleSwitcher } from "./LocaleSwitcher";

const LINKS = [["/", "home"], ["/catalog", "catalog"], ["/about", "about"]] as const;
const MENU = [...LINKS, ["/compare", "compare"]] as const; // mobile menu also gets Compare
const icon = "relative size-11 place-items-center rounded-full transition duration-150 hover:bg-action-soft hover:text-action active:scale-90";

// Small counter on top of an icon, hidden when 0
const Badge = ({ n, red = false }: { n: number; red?: boolean }) =>
  n > 0 ? <span key={n} aria-hidden className={`absolute right-0 top-0 grid h-[18px] min-w-[18px] animate-bump place-items-center rounded-full px-1 text-[10px] font-semibold text-white ${red ? "bg-danger" : "bg-action"}`}>{n > 99 ? "99+" : n}</span> : null;
const label = (name: string, n: number) => (n > 0 ? `${name} (${n})` : name);

export function Header() {
  const t = useTranslations("Nav");
  const path = usePathname(); // path without the locale prefix
  const [open, setOpen] = useState(false);
  const { fav, cmp, cart } = useStore();
  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header>
      <div className="flex h-[34px] items-center justify-center gap-2 bg-lavender text-xs"><Truck size={16} />{t("announcement")}</div>
      <div className="mx-auto flex h-[68px] w-full max-w-[1440px] items-center justify-between px-5 lg:h-[92px] lg:px-16">
        <Link href="/" className="flex flex-col">
          <span className="text-[22px] leading-[1.1] lg:text-[27px]">gamma piu</span>
          <span className="text-[9px] text-muted">PROFESSIONAL · BAKU</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm lg:flex">
          {LINKS.map(([href, key]) => (
            <Link key={key} href={href} aria-current={isActive(href) ? "page" : undefined} className={isActive(href) ? "font-semibold text-action" : ""}>{t(key)}</Link>
          ))}
        </nav>
        <div className="flex items-center lg:gap-2">
          <LocaleSwitcher className="mr-2 hidden lg:flex" />
          <Link href="/catalog" aria-label={t("search")} className={`${icon} grid`}><Search size={20} /></Link>
          <Link href="/favorites" aria-label={label(t("favorites"), fav.length)} className={`${icon} grid`}><Heart size={20} /><Badge n={fav.length} red /></Link>
          <Link href="/cart" aria-label={label(t("cart"), cartCount)} className={`${icon} grid`}><ShoppingBag size={20} /><Badge n={cartCount} /></Link>
          <Link href="/compare" aria-label={label(t("compare"), cmp.length)} className={`${icon} hidden lg:grid`}><Columns2 size={20} /><Badge n={cmp.length} /></Link>
          <button type="button" aria-label={t("menu")} aria-expanded={open} onClick={() => setOpen(!open)} className={`${icon} grid lg:hidden`}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {/* Mobile only: quick catalog link + language */}
      <div className="flex h-11 items-center justify-between px-5 text-xs lg:hidden">
        <Link href="/catalog" className="font-semibold text-action">{t("catalog")} →</Link>
        <LocaleSwitcher />
      </div>
      {open && (
        <nav className="flex flex-col border-t border-line px-5 py-2 text-sm lg:hidden">
          {MENU.map(([href, key]) => (
            <Link key={key} href={href} onClick={() => setOpen(false)} className="py-3">{t(key)}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
