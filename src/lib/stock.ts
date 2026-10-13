export type StockStatus = 'in_stock' | 'limited' | 'out';

const LOW_STOCK_LIMIT = 3; // show "low stock" when this many or fewer are left

export function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return 'out';
  if (stock <= LOW_STOCK_LIMIT) return 'limited';
  return 'in_stock';
}