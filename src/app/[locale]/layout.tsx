import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter } from 'next/font/google';
import { routing } from '@/i18n/routing';
import '../globals.css';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toast } from "@/components/layout/Toast";
import { CategoriesProvider } from "@/components/layout/CategoriesProvider";
import { SpecTypesProvider } from "@/components/layout/SpecTypesProvider";
import { getCategories } from "@/lib/category-data";
import { getSpecTypes } from "@/lib/spec-data";
import { getTranslations } from "next-intl/server";
import { SITE_URL, openGraph } from "@/lib/seo";


// latin-ext is needed for Azerbaijani letters (ə ğ ı ş ö ü), cyrillic for Russian
const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

// Runs before the page is painted, so there is no light flash: saved choice, else the system theme
const themeInit = `try{var t=localStorage.getItem("gp-theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Default title/description for every page (pages override them); metadataBase makes all links absolute
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    metadataBase: new URL(SITE_URL),
    title: t("siteTitle"),
    description: t("siteDescription"),
    openGraph: openGraph(locale),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [categories, specTypes] = await Promise.all([getCategories(locale), getSpecTypes(locale)]);

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider>
          <CategoriesProvider list={categories}>
            <SpecTypesProvider list={specTypes}>
              <Header/>
              <main className="flex-1">{children}</main>
              <Footer/>
              <Toast/>
            </SpecTypesProvider>
          </CategoriesProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}