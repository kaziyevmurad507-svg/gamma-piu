'use client';

import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Section';

// Prefetched with navigation, so visitors get feedback while dynamic data loads.
export default function Loading() {
  const t = useTranslations('Catalog');
  return (
    <Container role="status" aria-label={t('updating')} className="flex flex-col gap-8 py-8">
      <p className="text-sm text-muted">{t('updating')}</p>
      <div aria-hidden className="flex flex-col gap-8 motion-safe:animate-pulse">
        <div className="h-10 w-2/3 rounded-full bg-media" />
        <div className="h-12 rounded-card bg-media" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {[0, 1, 2, 3].map(key => <div key={key} className="flex min-w-0 flex-col gap-4">
            <div className="aspect-square rounded-card bg-media" />
            <div className="h-5 w-3/4 rounded-full bg-media" />
            <div className="h-10 rounded-full bg-media" />
          </div>)}
        </div>
      </div>
    </Container>
  );
}
