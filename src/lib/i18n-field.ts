// Pick a translated column (name_az / name_ru / name_en) with fallback: current -> az -> en -> ru
type Row = Record<string, unknown>;

export function pick(row: Row, field: string, locale: string): string {
  for (const l of [locale, 'az', 'en', 'ru']) {
    const value = row[`${field}_${l}`];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}