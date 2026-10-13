import { useTranslations } from "next-intl";
import { ArrowUpRight, Minus, Plus, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, SectionHead } from "../ui/Section";

export function Ordering() {
  const t = useTranslations("Home");
  return (
    <Container className="flex flex-col gap-12 py-8 lg:gap-16 lg:py-12">
      {/* Delivery banner */}
      <section id="delivery" className="flex scroll-mt-6 flex-col gap-6 rounded-bento bg-action-soft p-7 lg:flex-row lg:items-center lg:p-10">
        <span className="grid size-20 shrink-0 place-items-center rounded-full bg-canvas"><Truck size={36} /></span>
        <div className="flex flex-1 flex-col gap-2">
          <h2 className="text-[28px] font-medium leading-[1.2] lg:text-[34px]">{t("shipTitle")}</h2>
          <p className="text-sm text-muted">{t("shipText")}</p>
        </div>
        <p className="hidden text-[30px] font-medium text-action lg:block">{t("shipPrice")}</p>
      </section>

      {/* 3 steps */}
      <section id="how-to-order" className="flex scroll-mt-6 flex-col gap-7">
        <SectionHead eyebrow={t("stepsEyebrow")} title={t("stepsTitle")} />
        <div className="grid gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-col gap-4 rounded-card bg-media p-[26px]">
              <p className="text-[13px] font-semibold text-action">0{n}</p>
              <h3 className="text-[22px] font-medium">{t(`step${n}Title`)}</h3>
              <p className="text-sm text-muted">{t(`step${n}Text`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ: native <details>, no JS needed */}
      <section className="flex flex-col gap-6 lg:flex-row lg:gap-20">
        <div className="flex flex-col gap-3 lg:w-[390px]">
          <p className="text-[11px] text-muted">{t("faqEyebrow")}</p>
          <h2 className="text-[28px] font-medium leading-[1.2] lg:text-[38px]">{t("faqTitle")}</h2>
        </div>
        <div className="flex flex-1 flex-col gap-3">
          {[1, 2, 3].map((n) => (
            <details key={n} open={n === 1} className="group rounded-panel border border-line p-5">
              <summary className="flex cursor-pointer list-none items-center gap-3 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                <span className="flex-1">{t(`q${n}`)}</span>
                <Minus size={18} className="hidden group-open:block" />
                <Plus size={18} className="group-open:hidden" />
              </summary>
              <p className="pt-3 text-sm text-muted">{t(`a${n}`)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final call to action */}
      <section className="flex flex-col gap-6 rounded-bento bg-lavender p-7 lg:flex-row lg:items-center lg:p-10">
        <h2 className="flex-1 text-[30px] font-medium leading-[1.2] lg:text-[38px]">{t("finalTitle")}</h2>
        <Link href="/catalog" className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-action px-[22px] text-sm font-semibold text-canvas">
          {t("finalCta")}<ArrowUpRight size={18} />
        </Link>
      </section>
    </Container>
  );
}
