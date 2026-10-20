import { routing } from "@/i18n/routing";

// Public address of the site (set NEXT_PUBLIC_SITE_URL in .env.local and in Vercel, no trailing slash)
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Open Graph language codes
export const OG_LOCALE: Record<string, string> = { az: "az_AZ", ru: "ru_RU", en: "en_US" };

// Share card (WhatsApp, Telegram, Facebook): a page that sets its own openGraph replaces the layout one, so use this to keep siteName/locale
export const openGraph = (locale: string, extra: { title?: string; description?: string; images?: string[] } = {}) => ({
  type: "website" as const, siteName: "Gamma Piu", locale: OG_LOCALE[locale], ...extra,
});

// Canonical link + hreflang links for one page (path is without the language, e.g. "/catalog")
export function pageAlternates(locale: string, path = "") {
  return {
    canonical: `/${locale}${path}`,
    languages: { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])), "x-default": `/${routing.defaultLocale}${path}` },
  };
}

// For pages that should not be in Google (cart, favorites, compare are personal)
export const NO_INDEX = { index: false, follow: true } as const;
