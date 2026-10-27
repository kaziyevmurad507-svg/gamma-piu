import { Link } from "@/i18n/navigation";

// Breadcrumb + big title + blue counter chip + short text (same as the catalog header)
export function PageIntro({ home, crumb, title, chip, text }: { home: string; crumb: string; title: string; chip?: string; text: string }) {
  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-xs text-muted"><Link href="/" className="link-text">{home}</Link> / {crumb}</p>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="min-w-0 hyphens-auto break-words text-[34px] font-semibold leading-[1.12] sm:flex-1 lg:text-5xl">{title}</h1>
        {chip && <span className="flex h-11 shrink-0 items-center rounded-full bg-action-soft px-4 text-[13px] font-semibold text-action">{chip}</span>}
      </div>
      <p className="text-sm text-muted lg:text-base">{text}</p>
    </div>
  );
}

// Shown while data loads: gray blocks
export const Skeleton = ({ className }: { className: string }) => <div aria-hidden className={`animate-pulse rounded-card bg-media ${className}`} />;
