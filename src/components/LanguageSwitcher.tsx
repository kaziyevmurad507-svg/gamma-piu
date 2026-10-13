'use client';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export function LanguageSwitcher() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div role="group" aria-label={t('language')} className="flex gap-2">
      {routing.locales.map((l) => (
        <button
          key={l}
          onClick={() => router.replace(pathname, { locale: l })}
          aria-pressed={l === locale}
          className="min-h-11 min-w-11 rounded border px-3 aria-pressed:bg-black aria-pressed:text-white"
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}