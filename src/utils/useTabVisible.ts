import { useEffect, useState } from "react";

const isVisible = () => document.visibilityState === "visible";

/**
 * Becomes true the first time the tab is actually shown and stays true.
 * Tabs opened in the background (ctrl+click, session restore) therefore
 * never pay for mounting the app until the user switches to them.
 */
export function useHasBeenVisible(): boolean {
  const [seen, setSeen] = useState(isVisible);

  useEffect(() => {
    if (seen) return;
    const onChange = () => {
      if (isVisible()) setSeen(true);
    };
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [seen]);

  return seen;
}

/**
 * Marks <html> while the tab is hidden so CSS can pause animations
 * (canvas/rAF work is already throttled by the browser).
 */
export function trackTabHidden(): void {
  const apply = () =>
    document.documentElement.classList.toggle("tab-hidden", !isVisible());
  apply();
  document.addEventListener("visibilitychange", apply);
}

/** Tell the boot skeleton (public/boot.js) that a stage has finished. */
export function bootSignal(stage: "appMounted" | "wallpaperReady"): void {
  try {
    (window as any).__bootSkeleton?.[stage]?.();
  } catch {}
}
