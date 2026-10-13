import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' };

export function Button({ variant = 'primary', className, type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2.5 rounded-full px-[22px] text-sm font-semibold transition-colors disabled:cursor-not-allowed',
        variant === 'primary' &&
          'bg-action text-white hover:bg-action-hover active:bg-action-pressed disabled:bg-disabled',
        variant === 'secondary' &&
          'border border-line bg-canvas text-ink hover:bg-media disabled:text-muted',
        className,
      )}
      {...props}
    />
  );
}

// Round icon-only button, 44px = minimum comfortable tap size. aria-label is required.
export function IconButton({
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { 'aria-label': string }) {
  return (
    <button
      type={type}
      className={cn('grid size-11 place-items-center rounded-full transition-colors hover:bg-media', className)}
      {...props}
    />
  );
}