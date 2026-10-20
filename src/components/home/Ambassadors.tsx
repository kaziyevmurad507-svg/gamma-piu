import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Ambassador } from "@/lib/ambassadors";
import { Container, SectionHead } from "../ui/Section";

// Same grid and card feel as the product sections; the card links to the person's Instagram. No ambassadors = no section
export function Ambassadors({ people }: { people: Ambassador[] }) {
  const t = useTranslations("Home");
  if (!people.length) return null;
  return (
    <Container className="flex flex-col gap-7 py-8 lg:py-12">
      <SectionHead eyebrow={t("ambEyebrow")} title={t("ambTitle")} />
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
        {people.map((p) => (
          <article key={p.id} className="group flex min-w-0 animate-rise flex-col gap-3">
            <a href={p.url ?? undefined} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden className="relative block aspect-[4/5] overflow-hidden rounded-card border border-line bg-media">
              {p.image && <Image src={p.image} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />}
            </a>
            <div className="flex flex-col items-start gap-1.5 px-1">
              {p.role && <p className="text-xs text-muted">{p.role}</p>}
              <p className="text-[15px] font-semibold transition-colors group-hover:text-action lg:text-lg">{p.name}</p>
              {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="link-accent text-[13px] font-semibold">{p.handle}</a>}
            </div>
          </article>
        ))}
      </div>
    </Container>
  );
}
