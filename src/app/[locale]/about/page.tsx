import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { MessageCircle } from "lucide-react";
import { btnClass } from "@/components/ui/Button";
import { PageIntro } from "@/components/ui/PageIntro";
import { Container } from "@/components/ui/Section";
import { WA_URL } from "@/lib/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return { title: `${t("title")} · Gamma Piu` };
}

// Simple page built only from facts already on the site. Replace with the real design when it exists.
export default function AboutPage() {
  const t = useTranslations("About");
  const h = useTranslations("Home");
  const n = useTranslations("Nav");
  return (
    <Container className="flex flex-col gap-10 pb-16 pt-8">
      <PageIntro home={n("home")} crumb={n("about")} title={t("title")} text={t("intro")} />
      <div className="grid gap-5 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-4 rounded-card bg-media p-[26px]">
            <p className="text-[13px] font-semibold text-action">0{i}</p>
            <h2 className="text-[22px] font-medium">{h(`step${i}Title`)}</h2>
            <p className="text-sm text-muted">{h(`step${i}Text`)}</p>
          </div>
        ))}
      </div>
      <a href={WA_URL} target="_blank" rel="noopener noreferrer" className={`${btnClass()} w-fit`}><MessageCircle size={20} />{t("cta")}</a>
    </Container>
  );
}
