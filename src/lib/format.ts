// Format a price in AZN using the number style of the current language
export function formatPrice(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'AZN' }).format(amount);
}