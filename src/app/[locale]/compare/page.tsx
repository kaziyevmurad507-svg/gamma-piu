import { getTranslations } from "next-intl/server";
import { CompareView } from "@/components/compare/CompareView";
import { Container } from "@/components/ui/Section";
import { NO_INDEX } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Compare" });
  return { title: `${t("title")} · Gamma Piu`, robots: NO_INDEX };
}

export default function ComparePage() {
  return <Container className="pb-16 pt-8"><CompareView /></Container>;
}
