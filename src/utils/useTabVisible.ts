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

/** Tell the boot skeleton (public/boot.js) that a stage has finished. */
export function bootSignal(stage: "appMounted" | "wallpaperReady"): void {
  try {
    (window as any).__bootSkeleton?.[stage]?.();
  } catch {}
}

/**
 * Resolves once the browser has decoded the image at `src`, so the first
 * paint that uses it is not blank. Never rejects: an undecodable image just
 * resolves early (the skeleton's safety net covers any stall).
 */
export async function decodeImage(src: string): Promise<void> {
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
  } catch {}
}
