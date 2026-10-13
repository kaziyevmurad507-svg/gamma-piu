import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export function Input({ label, error, id, className, ...props }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-[13px] font-medium">{label}</label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-[52px] rounded-card border bg-canvas px-[18px] text-sm placeholder:text-muted',
          error ? 'border-danger' : 'border-line',
          className,
        )}
        {...props}
      />
      {error && <p id={errorId} className="text-xs text-danger">{error}</p>}
    </div>
  );
}