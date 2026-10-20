import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Check, MessageCircle } from "lucide-react";
import { btnClass } from "@/components/ui/Button";
import { PageIntro } from "@/components/ui/PageIntro";
import { Container, SectionHead } from "@/components/ui/Section";
import { WA_URL } from "@/lib/whatsapp";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return { title: `${t("title")} · Gamma Piu`, description: t("intro"), alternates: pageAlternates(locale, "/about") };
}

// Two parts: how the store works (Baku) and the story of the Gamma+ brand (facts from gammapiu.it, own wording)
export default function AboutPage() {
  const t = useTranslations("About");
  const h = useTranslations("Home");
  const n = useTranslations("Nav");
  return (
    <Container className="flex flex-col gap-14 pb-16 pt-8">
      <PageIntro home={n("home")} crumb={n("about")} title={t("title")} text={t("intro")} />

      <section className="flex flex-col gap-7">
        <SectionHead eyebrow={t("storeEyebrow")} title={t("storeTitle")} />
        <div className="grid gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-4 rounded-card bg-media p-[26px]">
              <p className="text-[13px] font-semibold text-action">0{i}</p>
              <h3 className="text-[22px] font-medium">{h(`step${i}Title`)}</h3>
              <p className="text-sm text-muted">{h(`step${i}Text`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-7">
        <SectionHead eyebrow={t("brandEyebrow")} title={t("brandTitle")} />
        <p className="max-w-[760px] text-sm text-muted lg:text-base">{t("brandText")}</p>
        <div className="grid grid-cols-3 gap-3 lg:gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2 rounded-card bg-media p-4 lg:p-[26px]">
              <p className="text-[28px] font-semibold leading-none text-action lg:text-[44px]">{t(`s${i}Value`)}</p>
              <p className="text-xs text-muted lg:text-sm">{t(`s${i}Label`)}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-4 rounded-card border border-line p-[26px]">
              <h3 className="text-[22px] font-medium">{t(`v${i}Title`)}</h3>
              <ul className="flex flex-col gap-2.5 text-sm text-muted">
                {["a", "b", "c"].map((k) => (
                  <li key={k} className="flex gap-2.5"><Check size={16} className="mt-0.5 shrink-0 text-action" />{t(`v${i}${k}`)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-card bg-media p-[26px] lg:flex-row lg:gap-16">
          <h3 className="text-[22px] font-medium lg:w-1/3">{t("eventsTitle")}</h3>
          <p className="text-sm text-muted lg:flex-1">{t("eventsText")}</p>
        </div>
      </section>

      <a href={WA_URL} target="_blank" rel="noopener noreferrer" className={`${btnClass()} w-fit`}><MessageCircle size={20} />{t("cta")}</a>
    </Container>
  );
}
