import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight, MessagesSquare } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { WA_URL } from "@/lib/whatsapp";
import { btnClass } from "../ui/Button";
import { Container } from "../ui/Section";

export function Editorial() {
  const t = useTranslations("Home");
  return (
    <Container className="flex flex-col gap-6 py-8 lg:py-12">
      <section className="group relative flex flex-col overflow-hidden rounded-bento bg-cream transition-shadow duration-300 ease-in-out hover:shadow-soft lg:flex-row">
        <div className="relative h-[300px] overflow-hidden lg:h-[450px] lg:w-[656px] lg:shrink-0">
          <Image src="/images/barber.jpg" alt="" fill sizes="(min-width:1024px) 656px, 100vw" className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105" />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-6 p-7 lg:p-12">
          <p className="text-[11px] font-semibold text-muted">{t("craftEyebrow")}</p>
          <h2 className="text-[34px] font-medium leading-[1.1] lg:text-[44px]">{t("craftTitle")}</h2>
          <p className="text-[15px] text-muted">{t("craftText")}</p>
          {/* after:inset-0 makes the whole banner clickable */}
          <Link href="/catalog" className={`${btnClass("bare")} w-fit border-line bg-canvas text-ink after:absolute after:inset-0 group-hover:border-action group-hover:bg-action-fill group-hover:text-white group-hover:shadow-[0_6px_18px_#2454f545]`}>
            {t("craftCta")}<ArrowUpRight size={18} className="transition-transform duration-200 ease-in-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <div className="flex flex-col gap-6 lg:flex-row">
        <section className="flex flex-1 items-center gap-4 rounded-bento bg-media p-7">
          <div className="flex flex-1 flex-col gap-3">
            <p className="text-[11px] font-semibold text-muted">{t("accEyebrow")}</p>
            <h3 className="text-[25px] font-medium leading-[1.15]">{t("accTitle")}</h3>
            <Link href="/catalog?cat=accessories" className="link-accent text-[13px] font-semibold">{t("accLink")}</Link>
          </div>
          <div className="relative h-[146px] w-[84px] shrink-0 lg:w-[180px]">
            <Image src="/images/accessories.png" alt="" fill sizes="180px" className="object-contain" />
          </div>
        </section>
        <section className="flex flex-col gap-3 rounded-bento bg-lavender p-7 lg:w-[448px]">
          <MessagesSquare size={26} />
          <h3 className="text-[25px] font-medium leading-[1.15]">{t("helpTitle")}</h3>
          <p className="text-sm text-muted">{t("helpText")}</p>
          <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="link-accent text-[13px] font-semibold">{t("helpLink")}</a>
        </section>
      </div>
    </Container>
  );
}
