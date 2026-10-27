"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Result<T> = { key: string; rows: T[] | null; error: boolean };
// Results belong to a particular ID list and locale. An old success or a failed
// request must never masquerade as an empty or fresh cart.
export function useLoaded<T>(ids: string[], load: (ids: string[]) => Promise<T[]>, scope = "") {
  const [result, setResult] = useState<Result<T>>({ key: "", rows: null, error: false });
  const [attempt, setAttempt] = useState(0);
  const idsKey = ids.join(",");
  const key = `${scope}:${idsKey}:${attempt}`;
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; });
  useEffect(() => {
    if (!idsKey) return;
    let live = true;
    loadRef.current(idsKey.split(","))
      .then((rows) => { if (live) setResult({ key, rows, error: false }); })
      .catch(() => { if (live) setResult({ key, rows: null, error: true }); });
    return () => { live = false; };
  }, [idsKey, key]);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const replaceRows = useCallback((rows: T[]) => setResult({ key, rows, error: false }), [key]);
  const current = result.key === key;
  return { rows: !idsKey ? [] : current ? result.rows : null, error: Boolean(idsKey && current && result.error), retry, replaceRows };
}
