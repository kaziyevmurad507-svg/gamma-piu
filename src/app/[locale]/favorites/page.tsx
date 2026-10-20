import { getTranslations } from "next-intl/server";
import { FavoritesView } from "@/components/favorites/FavoritesView";
import { Container } from "@/components/ui/Section";
import { NO_INDEX } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Favorites" });
  return { title: `${t("title")} · Gamma Piu`, robots: NO_INDEX };
}

export default function FavoritesPage() {
  return <Container className="pb-16 pt-8"><FavoritesView /></Container>;
}
