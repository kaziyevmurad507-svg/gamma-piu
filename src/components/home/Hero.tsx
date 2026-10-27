import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, MessageCircle, Scissors, Sparkles, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ProductDetail } from "@/lib/product";
import { money } from "@/lib/money";
import { btnClass } from "../ui/Button";
import { Container } from "../ui/Section";

const PROMISES = [[Scissors, "promise1"], [MessageCircle, "promise2"], [Truck, "promise3"]] as const;

export function Hero({ boosted, dryer }: { boosted: ProductDetail | null; dryer: ProductDetail | null }) {
  const t = useTranslations("Home");
  const price = (product: ProductDetail) => money(Math.min(...product.variants.map((variant) => variant.price)));
  return (
    <Container className="flex flex-col gap-6 pb-8 pt-4 lg:pb-10">
      <div className="flex flex-col gap-5 lg:flex-row">
        <section className="relative flex flex-col gap-5 overflow-hidden rounded-bento bg-linear-to-r from-hero-from via-hero-via via-60% to-warn-soft p-7 lg:h-[586px] lg:flex-1 lg:p-10">
          <p className="text-[11px] font-semibold">{t("eyebrow")}</p>
          <div className="flex flex-col gap-[22px]">
            <h1 className="hyphens-auto break-words text-[36px] font-semibold leading-[1.04] min-[390px]:text-[42px] lg:w-[430px] lg:text-[64px]">{t("heroTitle")}</h1>
            <p className="text-[15px] text-muted lg:w-[310px]">{t("heroText")}</p>
            <Link href="/catalog" className={`${btnClass()} w-fit`}>
              <ArrowUpRight size={20} />{t("shopNow")}
            </Link>
          </div>
          {/* Image sits under the text on mobile, floats to the right on desktop */}
          <div className="relative mx-auto mt-auto aspect-[41/39] w-full max-w-[260px] -rotate-10 lg:absolute lg:right-10 lg:top-3 lg:mt-0 lg:w-[410px] lg:max-w-none lg:-rotate-15">
            <Image src="/images/hero-clipper.png" alt="" fill preload sizes="(min-width:1024px) 410px, 260px" className="object-contain" />
          </div>
          {boosted && <Link href={`/product/${boosted.slug}`} className="link-text absolute bottom-8 left-10 hidden items-center gap-3 text-xs lg:flex"><ArrowDownRight size={20} />{boosted.name} · {price(boosted)}</Link>}
          <span className="absolute right-7 top-7 grid size-10 place-items-center rounded-full bg-canvas"><Sparkles size={18} /></span>
        </section>

        <div className="flex flex-col gap-5 lg:w-[352px]">
          <Link href={dryer ? `/product/${dryer.slug}` : "/catalog?cat=dryers"} className="group relative h-[228px] overflow-hidden rounded-bento bg-media p-6 tile-hover lg:h-[326px]">
            <p className="text-[11px] text-muted">{t("dryerEyebrow")}</p>
            <p className="mt-2 text-[26px] font-semibold transition-colors duration-300 group-hover:text-action">{dryer?.name ?? t("cat.dryers.title")}</p>
            {dryer?.images[0] && <div className="absolute right-12 top-[68px] aspect-square w-[132px] transition-transform duration-500 ease-in-out group-hover:-rotate-6 group-hover:scale-110 lg:right-20 lg:top-[100px] lg:w-[180px]"><Image src={dryer.images[0].url} alt="" fill sizes="(min-width:1024px) 180px, 132px" className="object-contain" /></div>}
            <span className="absolute bottom-6 left-6 flex items-center gap-2 text-[13px] font-medium transition-colors duration-300 group-hover:text-action">{dryer ? price(dryer) : t("shopNow")}<ArrowUpRight size={17} className="transition-transform duration-200 ease-in-out group-hover:-translate-y-0.5 group-hover:translate-x-1" /></span>
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
