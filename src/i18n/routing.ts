import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['az', 'ru', 'en'],
  defaultLocale: 'az',
  localePrefix: 'always',   // URLs are always /az, /ru, /en
  localeDetection: false,   // Don't guess from browser language, Azerbaijani is the default
});