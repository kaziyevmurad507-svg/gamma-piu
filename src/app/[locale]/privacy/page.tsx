import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { btnClass } from "@/components/ui/Button";
import { PageIntro } from "@/components/ui/PageIntro";
import { Container } from "@/components/ui/Section";
import { pageAlternates } from "@/lib/seo";
import { WA_URL } from "@/lib/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return { title: `${t("title")} · Gamma Piu`, description: t("intro"), alternates: pageAlternates(locale, "/privacy") };
}

// Plain text page: 5 short blocks (browser storage, WhatsApp orders, cookies, delivery/returns, questions)
export default function PrivacyPage() {
  const t = useTranslations("Privacy");
  const n = useTranslations("Nav");
  return (
    <Container className="flex flex-col gap-10 pb-16 pt-8">
      <PageIntro home={n("home")} crumb={t("title")} title={t("title")} text={t("intro")} />
      <div className="flex max-w-[760px] flex-col gap-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <section key={i} className="flex flex-col gap-2.5">
            <h2 className="text-[22px] font-medium">{t(`s${i}Title`)}</h2>
            <p className="text-sm text-muted lg:text-base">{t(`s${i}Text`)}</p>
          </section>
        ))}
      </div>
      <a href={WA_URL} target="_blank" rel="noopener noreferrer" className={`${btnClass()} w-fit`}><MessageCircle size={20} />{t("cta")}</a>
    </Container>
  );
}
