"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

// Note at the bottom: slides up, stays 2.5-4 s, slides down.
// "added" = product put in the cart (link to the cart). "removed" = line removed from the cart (Undo button)
export function Toast() {
  const t = useTranslations();
  const path = usePathname();
  const [kind, setKind] = useState<"added" | "removed">("added");
  const [show, setShow] = useState(false);
  const undo = useRef<() => void>(undefined);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const open = (k: "added" | "removed", ms: number) => { setKind(k); setShow(true); clearTimeout(timer); timer = setTimeout(() => setShow(false), ms); };
    const added = () => open("added", 2500);
    const removed = (e: Event) => { undo.current = (e as CustomEvent<() => void>).detail; open("removed", 4000); };
    window.addEventListener("gp:added", added);
    window.addEventListener("gp:removed", removed);
    return () => { window.removeEventListener("gp:added", added); window.removeEventListener("gp:removed", removed); clearTimeout(timer); };
  }, []);

  const visible = show && !(kind === "added" && path === "/cart"); // no need to point to the cart while on it
  const pill = "rounded-full bg-white px-3.5 py-1.5 font-semibold text-ink transition hover:bg-action-soft hover:text-action active:scale-95";
  return (
    <div role="status" aria-live="polite"
      className={`fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink py-2.5 pl-4 pr-2.5 text-[13px] text-white shadow-soft transition duration-300 ease-in-out ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}>
      {kind === "added" ? <Check size={16} aria-hidden className="text-[#7fd6a8]" /> : <Trash2 size={16} aria-hidden />}
      <span>{kind === "added" ? t("Product.addedToast") : t("Cart.removedToast")}</span>
      {kind === "added"
        ? <Link href="/cart" tabIndex={visible ? 0 : -1} className={pill}>{t("Product.goToCart")}</Link>
        : <button type="button" tabIndex={visible ? 0 : -1} onClick={() => { undo.current?.(); setShow(false); }} className={pill}>{t("Cart.undo")}</button>}
    </div>
  );
}
