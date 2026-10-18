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


// latin-ext is needed for Azerbaijani letters (ə ğ ı ş ö ü), cyrillic for Russian
const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
    <html lang={locale} className={inter.variable}>
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