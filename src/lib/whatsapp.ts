// Put your number in .env.local: NEXT_PUBLIC_WHATSAPP=994XXXXXXXXX
export const WA_URL = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP ?? ""}`;
