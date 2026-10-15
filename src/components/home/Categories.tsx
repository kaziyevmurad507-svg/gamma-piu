import { useTranslations } from "next-intl";
import { Layers, ScanLine, Scissors, Settings2, Wind } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, SectionHead } from "../ui/Section";

// "blades" card opens two catalog categories at once
const ITEMS = [
  { key: "clippers", Icon: Scissors, cats: ["clippers"] },
  { key: "trimmers", Icon: ScanLine, cats: ["trimmers"] },
  { key: "dryers", Icon: Wind, cats: ["dryers"] },
  { key: "scissors", Icon: Scissors, cats: ["scissors"] },
  { key: "shavers", Icon: Layers, cats: ["shavers"] },
  { key: "blades", Icon: Settings2, cats: ["blades", "accessories"] },
] as const;

export function Categories() {
  const t = useTranslations("Home");
  return (
    <Container className="flex flex-col gap-7 py-8 lg:py-12">
      <SectionHead eyebrow={t("categoriesEyebrow")} title={t("categoriesTitle")} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {ITEMS.map(({ key, Icon, cats }) => (
          <Link key={key} href={`/catalog?${cats.map((c) => `cat=${c}`).join("&")}`} className="group flex h-[152px] flex-col gap-3 rounded-card bg-media p-5 transition duration-200 hover:-translate-y-1 hover:bg-action-soft hover:shadow-soft active:scale-[0.98] lg:h-[178px]">
            <Icon size={26} className="text-action transition-transform duration-200 group-hover:scale-110" />
            <p className="mt-auto text-[15px] font-semibold transition-colors group-hover:text-action">{t(`cat.${key}.title`)}</p>
            <p className="text-xs text-muted">{t(`cat.${key}.sub`)}</p>
          </Link>
        ))}
      </div>
    </Container>
  );
}
