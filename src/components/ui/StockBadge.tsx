import type { StockStatus } from '@/lib/stock';
import { cn } from '@/lib/cn';

// Always text + color, never color only
const styles: Record<StockStatus, { badge: string; dot: string }> = {
  in_stock: { badge: 'bg-ok-soft text-ok', dot: 'bg-ok' },
  limited: { badge: 'bg-warn-soft text-warn', dot: 'bg-warn' },
  out: { badge: 'bg-media text-ink', dot: 'bg-muted' },
};

export function StockBadge({ status, label }: { status: StockStatus; label: string }) {
  const s = styles[status];
  return (
    <span className={cn('inline-flex items-center gap-[5px] rounded-full px-2.5 py-1.5 text-[11px] font-medium', s.badge)}>
      <span className={cn('size-[5px] rounded-full', s.dot)} aria-hidden="true" />
      {label}
    </span>
  );
}