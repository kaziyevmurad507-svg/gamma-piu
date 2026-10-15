"use client";
// Loads rows for a list of ids with a server action. null = still loading.
import { useEffect, useState } from "react";

export function useLoaded<T>(ids: string[], load: (ids: string[]) => Promise<T[]>) {
  const [rows, setRows] = useState<T[] | null>(null);
  const key = ids.join(",");
  useEffect(() => {
    if (!key) return;
    let live = true;
    load(key.split(",")).then((r) => live && setRows(r));
    return () => { live = false; };
  }, [key, load]);
  return key ? rows : []; // no ids = nothing to load
}
