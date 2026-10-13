import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

// Centers content and gives the same side padding everywhere
export function Container({ className = "", ...p }: ComponentProps<"div">) {
  return <div className={`mx-auto w-full max-w-[1440px] px-5 lg:px-16 ${className}`} {...p} />;
}

// Small gray label + big title (+ optional link on desktop)
export function SectionHead({ eyebrow, title, href, linkText }: { eyebrow: string; title: string; href?: string; linkText?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-semibold text-muted">{eyebrow}</p>
      <div className="flex items-center gap-5">
        <h2 className="flex-1 text-[28px] font-semibold leading-[1.15] lg:text-[38px]">{title}</h2>
        {href && <Link href={href} className="hidden text-xs text-action lg:block">{linkText}</Link>}
      </div>
    </div>
  );
}
