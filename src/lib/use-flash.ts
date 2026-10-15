"use client";
// const [on, flash] = useFlash(): flash() sets `on` to true for 1.5 s (used to show "Added" on buttons)
import { useEffect, useRef, useState } from "react";

export function useFlash(ms = 1500) {
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [on, () => { setOn(true); clearTimeout(timer.current); timer.current = setTimeout(() => setOn(false), ms); }] as const;
}
