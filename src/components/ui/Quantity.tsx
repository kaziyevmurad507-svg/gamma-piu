"use client";
import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

type Props = {
  value: number;
  max: number; // stock of the selected variant
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
};

export function Quantity({ value, max, onChange, decreaseLabel, increaseLabel }: Props) {
  const [clicks, setClicks] = useState(0); // new key = the number "pops" after every click
  const btn = 'grid size-11 place-items-center rounded-full transition duration-150 hover:bg-action-soft hover:text-action active:scale-90 disabled:text-disabled disabled:hover:bg-transparent disabled:hover:text-disabled';
  const change = (v: number) => { setClicks(clicks + 1); onChange(v); };
  return (
    <div className="inline-flex h-12 w-33 items-center justify-between rounded-full border border-line px-1 transition-colors hover:border-action">
      <button type="button" aria-label={decreaseLabel} disabled={value <= 1} onClick={() => change(value - 1)} className={btn}>
        <Minus size={16} aria-hidden="true" />
      </button>
      <span key={clicks} aria-live="polite" className={`font-semibold ${clicks ? 'animate-pop' : ''}`}>{value}</span>
      <button type="button" aria-label={increaseLabel} disabled={value >= max} onClick={() => change(value + 1)} className={btn}>
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
