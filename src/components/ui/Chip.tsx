import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean };

export function Chip({ selected = false, className, type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'h-11 rounded-full px-4 text-[13px] transition duration-150 active:scale-95 disabled:cursor-not-allowed disabled:bg-media disabled:text-muted',
        selected ? 'bg-action-soft font-semibold text-action' : 'bg-media text-ink hover:bg-action-soft hover:text-action',
        className,
      )}
      {...props}
    />
  );
}