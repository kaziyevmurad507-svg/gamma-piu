'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from './Button';
import { Chip } from './Chip';
import { StockBadge } from './StockBadge';
import { Quantity } from './Quantity';
import { Input } from './Input';

export function KitPreview() {
  const t = useTranslations();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState(false);

  return (
    <div className="mt-8 flex max-w-md flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <Button>{t('Common.catalog')}</Button>
        <Button variant="secondary">{t('Common.compare')}</Button>
        <Button disabled>{t('Common.cart')}</Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Chip selected={selected} onClick={() => setSelected(!selected)}>Qara</Chip>
        <Chip disabled>Gümüşü</Chip>
      </div>
      <div className="flex flex-wrap gap-3">
        <StockBadge status="in_stock" label={t('Stock.inStock')} />
        <StockBadge status="limited" label={t('Stock.limited')} />
        <StockBadge status="out" label={t('Stock.out')} />
      </div>
      <Quantity value={qty} max={5} onChange={setQty} decreaseLabel={t('Quantity.decrease')} increaseLabel={t('Quantity.increase')} />
      <Input label={t('Common.search')} placeholder="..." />
      <Input label={t('Common.search')} error="Error text" defaultValue="x" />
    </div>
  );
}