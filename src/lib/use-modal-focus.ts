"use client";

import { useEffect, type RefObject } from "react";

const focusable = 'a[href], button, input, select, textarea, [tabindex]';

// Keep keyboard and screen-reader navigation in an open modal, then restore its trigger.
export function useModalFocus(open: boolean, ref: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    const background: { element: HTMLElement; inert: boolean }[] = [];
    let branch: HTMLElement = dialog;
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling instanceof HTMLElement && sibling !== branch) {
          background.push({ element: sibling, inert: sibling.inert });
          sibling.setAttribute("inert", "");
        }
      }
      if (branch.parentElement === document.body) break;
      branch = branch.parentElement;
    }
    document.body.style.overflow = "hidden";

    const targets = () => [...dialog.querySelectorAll<HTMLElement>(focusable)]
      .filter((element) => element.tabIndex >= 0 && !element.matches(':disabled, [hidden]') && element.getClientRects().length > 0);
    const focusFirst = () => (targets()[0] ?? dialog).focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      } else if (event.key === "Tab") {
        const items = targets();
        const first = items[0], last = items[items.length - 1];
        if (!first) {
          event.preventDefault();
          dialog.focus();
        } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (!dialog.contains(event.target as Node)) focusFirst();
    };
    focusFirst();
    dialog.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      dialog.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
      background.forEach(({ element, inert }) => { if (!inert) element.removeAttribute("inert"); });
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open, ref, close]);
}
