// 1120 -> "1 120 AZN", 12.5 -> "12.50 AZN"
export const money = (n: number) =>
  `${(Number.isInteger(n) ? n : n.toFixed(2)).toLocaleString("en-US").replace(/,/g, "\u00a0")} AZN`;
