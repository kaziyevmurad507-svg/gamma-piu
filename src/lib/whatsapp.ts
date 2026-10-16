// Put your number in .env.local: NEXT_PUBLIC_WHATSAPP=994XXXXXXXXX
export const WA_URL = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP ?? ""}`;

export type OrderLine = { name: string; variant: string; qty: number; price: number; link: string };

// Builds the wa.me link with the order text: one block per cart line, then the total
export function orderUrl(lines: OrderLine[], head: string, totalLabel: string, total: string, fmt: (n: number) => string) {
  const body = lines
    .map((l, i) => `${i + 1}. ${l.name}${l.variant ? ` (${l.variant})` : ""}\n${l.qty} × ${fmt(l.price)} = ${fmt(l.qty * l.price)}\n${l.link}`)
    .join("\n\n");
  return `${WA_URL}?text=${encodeURIComponent(`${head}\n\n${body}\n\n${totalLabel}: ${total}`)}`;
}
