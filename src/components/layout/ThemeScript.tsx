"use client";
import { useLayoutEffect } from "react";

// Runs before the page is painted, so there is no light flash: saved choice, else the system theme
const themeInit = `try{var t=localStorage.getItem("gp-theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

// The script goes into the server HTML only (the browser runs it once). On the client we render nothing:
// React 19 warns about every <script> it creates itself, and React skips the extra server node while hydrating <body>
export function ThemeScript({ locale }: { locale: string }) {
  // Locale navigation updates <html>; restore its theme before the next paint.
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem("gp-theme");
      document.documentElement.dataset.theme = saved === "dark" || saved === "light"
        ? saved
        : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {}
  }, [locale]);
  return typeof window === "undefined" ? <script dangerouslySetInnerHTML={{ __html: themeInit }} /> : null;
}
