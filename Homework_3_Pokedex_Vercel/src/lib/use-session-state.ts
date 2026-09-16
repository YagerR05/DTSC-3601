"use client";

import { useEffect, useState } from "react";

/**
 * Like useState, but mirrors the value to sessionStorage so it survives a
 * navigate-away-and-back (e.g. clicking a Pokemon's Summary link and then
 * hitting Back/Home) instead of resetting when the component remounts.
 * Starts at `initial` on first render (so SSR/hydration match), then swaps
 * in anything already stored - the `loaded` guard stops that swap-in from
 * being immediately overwritten by the initial-value persist effect.
 */
export function useSessionState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      // ignore (private mode / corrupted value)
    } finally {
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore (private mode / quota)
    }
  }, [key, value, loaded]);

  return [value, setValue] as const;
}
