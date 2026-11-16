"use client";

import { useEffect } from "react";

// Keep focus in place for dialogs and forms, but show rings only for keyboard use.
export function FocusMode() {
  useEffect(() => {
    const root = document.documentElement;
    const pointer = () => { root.dataset.focusMode = "pointer"; };
    const keyboard = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        root.dataset.focusMode = "keyboard";
      }
    };
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", keyboard, true);
      delete root.dataset.focusMode;
    };
  }, []);
  return null;
}
