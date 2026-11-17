import { routing } from "@/i18n/routing";

// Public address of the site (set NEXT_PUBLIC_SITE_URL in .env.local and in Vercel, no trailing slash)
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const IS_NON_PRODUCTION = (process.env.VERCEL_ENV !== undefined && process.env.VERCEL_ENV !== "production") || ["preview", "pre-prod"].includes(process.env.APP_ENV ?? "");

// Open Graph language codes
export const OG_LOCALE: Record<string, string> = { az: "az_AZ", ru: "ru_RU", en: "en_US" };

export const SITE_NAME = "Gamma+ Azərbaycan";
export const BRAND_NAMES = ["Gamma+", "Gamma Plus", "Gamma Piu", "Gamma Più", "Гамма Плюс", "Гамма Пиу"];

// Share card (WhatsApp, Telegram, Facebook): a page that sets its own openGraph replaces the layout one, so use this to keep siteName/locale
export const openGraph = (locale: string, extra: { title?: string; description?: string; images?: string[] } = {}) => ({
  type: "website" as const, siteName: SITE_NAME, locale: OG_LOCALE[locale], images: [`${SITE_URL}/images/share-card.png`], ...extra,
});

// One shop and website identity across translations; no unverified physical address or distributor claims.
export function homeStructuredData(locale: string, description: string) {
  const shopId = `${SITE_URL}/#store`;
  const websiteId = `${SITE_URL}/#website`;
  const phone = process.env.NEXT_PUBLIC_WHATSAPP;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "OnlineStore",
        "@id": shopId,
        name: SITE_NAME,
        alternateName: BRAND_NAMES,
        url: `${SITE_URL}/`,
        description,
        image: `${SITE_URL}/images/share-card.png`,
        logo: `${SITE_URL}/apple-icon.png`,
        areaServed: { "@type": "City", name: "Baku", alternateName: ["Bakı", "Баку"] },
        ...(phone && /^994\d{9}$/.test(phone) ? {
          contactPoint: {
            "@type": "ContactPoint",
            telephone: `+${phone}`,
            url: `https://wa.me/${phone}`,
            contactType: "customer service",
            availableLanguage: ["az", "ru", "en"],
          },
        } : {}),
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: SITE_NAME,
        alternateName: [...BRAND_NAMES, "gammapiu.az"],
        url: `${SITE_URL}/`,
        inLanguage: routing.locales,
        publisher: { "@id": shopId },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/${locale}#webpage`,
        url: `${SITE_URL}/${locale}`,
        inLanguage: locale,
        description,
        isPartOf: { "@id": websiteId },
        about: { "@id": shopId },
      },
    ],
  };
}

// Canonical link + hreflang links for one page (path is without the language, e.g. "/catalog")
export function pageAlternates(locale: string, path = "") {
  return {
    canonical: `/${locale}${path}`,
    languages: { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])), "x-default": `/${routing.defaultLocale}${path}` },
  };
}

// For pages that should not be in Google (cart, favorites, compare are personal)
export const NO_INDEX = { index: false, follow: true } as const;
