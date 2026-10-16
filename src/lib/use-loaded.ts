"use client";
// Loads rows for a list of ids with a server action. null = still loading.
import { useEffect, useRef, useState } from "react";

export function useLoaded<T>(ids: string[], load: (ids: string[]) => Promise<T[]>) {
  const [rows, setRows] = useState<T[] | null>(null);
  const key = ids.join(",");
  // Keep the latest load function in a ref: callers pass a new function on every render,
  // and it must not restart the request
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; });
  useEffect(() => {
    if (!key) return;
    let live = true;
    loadRef.current(key.split(",")).then((r) => live && setRows(r)).catch(() => live && setRows((old) => old ?? []));
    return () => { live = false; };
  }, [key]);
  return key ? rows : []; // no ids = nothing to load
}
