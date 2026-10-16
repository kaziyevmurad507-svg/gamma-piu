import type { ComponentProps } from "react";
import { ArrowRight } from "lucide-react";
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
        {href && <SeeAllLink href={href} className="hidden lg:inline-flex">{linkText}</SeeAllLink>}
      </div>
    </div>
  );
}

// "View all" pill: soft blue, fills blue on hover, arrow slides right
export function SeeAllLink({ href, className = "", children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`group inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-action-soft px-6 text-sm font-semibold text-action transition duration-200 ease-in-out hover:bg-action hover:text-white hover:shadow-[0_6px_18px_#2454f545] active:scale-95 ${className}`}>
      {children}<ArrowRight size={18} className="transition-transform duration-200 ease-in-out group-hover:translate-x-1" />
    </Link>
  );
}
