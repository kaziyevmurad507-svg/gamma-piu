"use client";
import { useTranslations } from "next-intl";
import { Button } from "./Button";

export function LoadError({ retry }: { retry: () => void }) {
  const t = useTranslations("Common");
  return <div role="alert" className="flex flex-col items-start gap-4 rounded-card border border-line p-6">
    <p>{t("loadError")}</p>
    <Button variant="secondary" onClick={retry}>{t("retry")}</Button>
  </div>;
}
