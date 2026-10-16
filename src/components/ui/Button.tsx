import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'success' | 'bare'; // bare = shape only, colors come from className

// One place for button look: used by Button, LinkButton and plain <a> buttons
export const btnClass = (variant: Variant = 'primary') =>
  cn(
    'inline-flex h-12 items-center justify-center gap-2.5 rounded-full px-[22px] text-sm font-semibold transition duration-150 active:scale-[0.97] disabled:cursor-not-allowed',
    variant === 'primary' &&
      'bg-action text-white hover:bg-action-hover hover:shadow-[0_6px_18px_#2454f545] active:bg-action-pressed disabled:bg-disabled disabled:shadow-none',
    variant === 'secondary' &&
      'border border-line bg-canvas text-ink hover:border-action hover:bg-action-soft hover:text-action active:bg-action-soft disabled:text-muted disabled:hover:border-line disabled:hover:bg-canvas disabled:hover:text-muted',
    variant === 'success' && 'bg-ok text-white',
    variant === 'bare' && 'border',
  );

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = 'primary', className, type = 'button', ...props }: Props) {
  return <button type={type} className={cn(btnClass(variant), className)} {...props} />;
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
      className={cn('grid size-11 place-items-center rounded-full transition duration-150 hover:bg-action-soft hover:text-action active:scale-90', className)}
      {...props}
    />
  );
}
