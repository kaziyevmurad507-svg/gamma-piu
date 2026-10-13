import { Minus, Plus } from 'lucide-react';

type Props = {
  value: number;
  max: number; // stock of the selected variant
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
};

export function Quantity({ value, max, onChange, decreaseLabel, increaseLabel }: Props) {
  const btn = 'grid size-11 place-items-center rounded-full disabled:text-disabled';
  return (
    <div className="inline-flex h-12 w-33 items-center justify-between rounded-full border border-line px-1">
      <button type="button" aria-label={decreaseLabel} disabled={value <= 1} onClick={() => onChange(value - 1)} className={btn}>
        <Minus size={16} aria-hidden="true" />
      </button>
      <span aria-live="polite" className="font-semibold">{value}</span>
      <button type="button" aria-label={increaseLabel} disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}>
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}