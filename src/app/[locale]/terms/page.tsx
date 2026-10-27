import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { PageIntro } from "@/components/ui/PageIntro";
import { Container } from "@/components/ui/Section";
import { btnClass } from "@/components/ui/Button";
import { pageAlternates } from "@/lib/seo";
import { WA_URL } from "@/lib/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Terms" });
  return { title: `${t("title")} · Gamma Piu`, description: t("intro"), alternates: pageAlternates(locale, "/terms") };
}

export default function TermsPage() {
  const t = useTranslations("Terms");
  const n = useTranslations("Nav");
  return (
    <Container className="flex flex-col gap-10 pb-16 pt-8">
      <PageIntro home={n("home")} crumb={t("title")} title={t("title")} text={t("intro")} />
      <div className="flex max-w-[760px] flex-col gap-8">
        {[1, 2, 3, 4].map((i) => <section key={i} className="flex flex-col gap-2.5">
          <h2 className="text-[22px] font-medium">{t(`s${i}Title`)}</h2>
          <p className="break-words text-sm text-muted lg:text-base">{t(`s${i}Text`)}</p>
        </section>)}
        <a href="mailto:kaziyevmurad507@gmail.com" className="break-all text-action underline">kaziyevmurad507@gmail.com</a>
      </div>
      <a href={WA_URL} target="_blank" rel="noopener noreferrer" className={`${btnClass()} w-fit`}>{t("cta")}</a>
    </Container>
  );
}
