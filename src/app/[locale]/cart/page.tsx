import { getTranslations } from "next-intl/server";
import { CartView } from "@/components/cart/CartView";
import { Container } from "@/components/ui/Section";
import { NO_INDEX } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cart" });
  return { title: `${t("title")} · Gamma Piu`, robots: NO_INDEX };
}

export default function CartPage() {
  return <Container className="pb-16 pt-8"><CartView /></Container>;
}
