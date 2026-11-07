"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Result<T> = { key: string; scope: string; attempt: number; ids: string[]; rows: T[] | null; error: boolean };
// Results belong to a particular ID list and locale. An old success or a failed
// request must never masquerade as an empty or fresh cart.
export function useLoaded<T>(ids: string[], load: (ids: string[]) => Promise<T[]>, scope = "", reuseKnownRows = false) {
  const [result, setResult] = useState<Result<T>>({ key: "", scope: "", attempt: -1, ids: [], rows: null, error: false });
  const [attempt, setAttempt] = useState(0);
  const idsKey = ids.join(",");
  const key = `${scope}:${idsKey}:${attempt}`;
  // Removing or undoing a cart line only changes the visible selection. Keep
  // known rows mounted; checkout still validates every price and stock afresh.
  const reusable = reuseKnownRows && result.scope === scope && result.attempt === attempt
    && result.rows !== null && !result.error && ids.every((id) => result.ids.includes(id));
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; });
  useEffect(() => {
    if (!idsKey || reusable) return;
    let live = true;
    const snapshot = { key, scope, attempt, ids: idsKey.split(",") };
    loadRef.current(idsKey.split(","))
      .then((rows) => { if (live) setResult({ ...snapshot, rows, error: false }); })
      .catch(() => { if (live) setResult({ ...snapshot, rows: null, error: true }); });
    return () => { live = false; };
  }, [idsKey, key, scope, attempt, reusable]);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const replaceRows = useCallback((rows: T[]) => setResult({ key, scope, attempt, ids: idsKey ? idsKey.split(",") : [], rows, error: false }), [key, scope, attempt, idsKey]);
  const current = result.key === key;
  return { rows: !idsKey ? [] : current || reusable ? result.rows : null, error: Boolean(idsKey && current && result.error), retry, replaceRows };
}
