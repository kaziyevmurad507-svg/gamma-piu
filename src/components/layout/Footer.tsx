import { useTranslations } from "next-intl";
import { Logo } from "./Logo";
import { Info } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { WA_URL } from "@/lib/whatsapp";
import { LocaleSwitcher } from "./LocaleSwitcher";

const col = "flex flex-col gap-3 text-[13px] text-muted";
const head = "text-sm font-semibold text-ink";

export function Footer() {
  const t = useTranslations();
  return (
    <footer className="bg-media">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 pb-8 pt-12 lg:px-16">
        <div className="flex flex-col gap-7 lg:flex-row lg:gap-20">
          <div className="flex flex-col gap-3.5 lg:w-[370px]">
            <Logo className="h-8 w-auto self-start" />
            <p className="text-sm text-muted">{t("Footer.tagline")}</p>
          </div>
          <div className="flex flex-1 justify-between gap-6">
            <div className={col}>
              <p className={head}>{t("Footer.shop")}</p>
              <Link href="/catalog">{t("Nav.catalog")}</Link>
              <Link href="/favorites">{t("Nav.favorites")}</Link>
              <Link href="/compare">{t("Nav.compare")}</Link>
            </div>
            <div className={col}>
              <p className={head}>{t("Footer.support")}</p>
              <Link href="/#delivery">{t("Footer.delivery")}</Link>
              <Link href="/#how-to-order">{t("Footer.howToOrder")}</Link>
              <a href={WA_URL} target="_blank" rel="noopener noreferrer">{t("Footer.whatsapp")}</a>
            </div>
            <div className={`${col} hidden lg:flex`}>
              <p className={head}>{t("Footer.language")}</p>
              <LocaleSwitcher />
            </div>
          </div>
        </div>
        <p className="flex gap-2.5 rounded-panel bg-cream p-4 text-xs text-warn"><Info size={18} className="shrink-0" />{t("Footer.notice")}</p>
        <div className="flex flex-col gap-3 text-[11px] text-muted lg:flex-row lg:justify-between">
          <p>{t("Footer.legal")}</p>
          <p>{t("Footer.currency")}</p>
        </div>
      </div>
    </footer>
  );
}
