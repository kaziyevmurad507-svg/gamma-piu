"use client";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

// Switches light/dark by setting data-theme on <html> and remembers the choice.
// Both icons are in the HTML and CSS shows the right one, so there is no flash and no hydration mismatch
export function ThemeToggle({ className = "" }: { className?: string }) {
  const t = useTranslations("Nav");
  const toggle = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("gp-theme", next); } catch {} // private mode: the theme still changes, just not remembered
  };
  return (
    <button type="button" aria-label={t("theme")} onClick={toggle} className={className}>
      <Moon size={20} className="dark:hidden" />
      <Sun size={20} className="hidden dark:block" />
    </button>
  );
}
