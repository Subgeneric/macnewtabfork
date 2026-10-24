import { useEffect, useRef, useState } from "react";
import { isLocaleLoaded, loadLocale } from "./loadLocale";

/**
 * Turns the locale the user asked for into one whose strings are loaded.
 *
 * Components index `translation[locale]` directly, so they must never be
 * given a locale that hasn't loaded yet. While `wanted` is loading this keeps
 * returning the last usable locale (English at first). `ready` becomes true
 * once `wanted` has loaded, or once loading it has failed.
 */
export function useLoadedLocale(wanted: string): {
  locale: string;
  ready: boolean;
} {
  const lastUsable = useRef("en");
  const [settled, setSettled] = useState<string | null>(null);
  const loaded = isLocaleLoaded(wanted);

  useEffect(() => {
    if (isLocaleLoaded(wanted)) return;
    let cancelled = false;
    loadLocale(wanted).then(() => {
      if (!cancelled) setSettled(wanted);
    });
    return () => {
      cancelled = true;
    };
  }, [wanted]);

  if (loaded) lastUsable.current = wanted;
  return {
    locale: loaded ? wanted : lastUsable.current,
    ready: loaded || settled === wanted,
  };
}
