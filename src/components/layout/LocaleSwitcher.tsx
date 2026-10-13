"use client";
import { Fragment } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const LOCALES = ["az", "ru", "en"] as const;

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const current = useLocale();
  const path = usePathname();
  return (
    <div className={`flex gap-1.5 text-xs font-semibold ${className}`}>
      {LOCALES.map((l, i) => (
        <Fragment key={l}>
          {i > 0 && <span className="text-muted">·</span>}
          <Link href={path} locale={l} className={l === current ? "text-action" : "text-muted"}>{l.toUpperCase()}</Link>
        </Fragment>
      ))}
    </div>
  );
}
