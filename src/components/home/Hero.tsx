import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, MessageCircle, Scissors, Sparkles, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { btnClass } from "../ui/Button";
import { Container } from "../ui/Section";

const PROMISES = [[Scissors, "promise1"], [MessageCircle, "promise2"], [Truck, "promise3"]] as const;

export function Hero() {
  const t = useTranslations("Home");
  return (
    <Container className="flex flex-col gap-6 pb-8 pt-4 lg:pb-10">
      <div className="flex flex-col gap-5 lg:flex-row">
        <section className="relative flex flex-col gap-5 overflow-hidden rounded-bento bg-linear-to-r from-[#e1dff7] via-[#f0edf9] via-60% to-warn-soft p-7 lg:h-[586px] lg:flex-1 lg:p-10">
          <p className="text-[11px] font-semibold">{t("eyebrow")}</p>
          <div className="flex flex-col gap-[22px]">
            <h1 className="text-[42px] font-semibold leading-[1.04] lg:w-[430px] lg:text-[64px]">{t("heroTitle")}</h1>
            <p className="text-[15px] text-muted lg:w-[310px]">{t("heroText")}</p>
            <Link href="/catalog" className={`${btnClass()} w-fit`}>
              <ArrowUpRight size={20} />{t("shopNow")}
            </Link>
          </div>
          {/* Image sits under the text on mobile, floats to the right on desktop */}
          <div className="mt-auto flex justify-center lg:absolute lg:right-10 lg:top-3 lg:mt-0">
            <Image src="/images/hero-clipper.png" alt="" width={410} height={390} priority className="h-auto w-[260px] -rotate-10 lg:w-[410px] lg:-rotate-15" />
          </div>
          <p className="absolute bottom-8 left-10 hidden items-center gap-3 text-xs lg:flex"><ArrowDownRight size={20} />{t("heroNote")}</p>
          <span className="absolute right-7 top-7 grid size-10 place-items-center rounded-full bg-canvas"><Sparkles size={18} /></span>
        </section>

        <div className="flex flex-col gap-5 lg:w-[352px]">
          <Link href="/catalog?cat=dryers" className="relative h-[228px] overflow-hidden rounded-bento bg-media p-6 lg:h-[326px]">
            <p className="text-[11px] text-muted">{t("dryerEyebrow")}</p>
            <p className="mt-2 text-[26px] font-semibold">iQ Perfetto</p>
            <Image src="/images/dryer.png" alt="" width={250} height={198} className="absolute left-[134px] top-[60px] h-auto w-[196px] lg:left-[54px] lg:top-[88px] lg:w-[250px]" />
            <span className="absolute bottom-6 left-6 flex items-center gap-2 text-[13px] font-medium">{t("dryerPrice")}<ArrowUpRight size={17} /></span>
          </Link>
          <div className="flex h-[186px] flex-col gap-3 rounded-bento bg-cream p-7 lg:h-[240px]">
            <Truck size={28} />
            <p className="text-[26px] font-medium leading-[1.15]">{t("deliveryTitle")}</p>
            <p className="text-[13px] text-muted">{t("deliveryText")}</p>
          </div>
        </div>
      </div>

      <ul className="flex flex-col gap-3.5 px-1 py-2 lg:flex-row lg:justify-between lg:px-4">
        {PROMISES.map(([Icon, k]) => (
          <li key={k} className="flex items-center gap-2.5 text-[13px] text-muted"><Icon size={18} />{t(k)}</li>
        ))}
      </ul>
    </Container>
  );
}
