import { Inter } from "next/font/google";
import "../globals.css";

// The admin is a separate root layout: no language prefix, no translations (Russian only)
const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-inter", display: "swap" });

export const metadata = { title: "Gamma Piu · Админка", robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
