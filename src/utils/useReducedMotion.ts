import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/provider";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Whether the app should reduce motion: "Reduced motion" is On, or it is
 * System and the operating system asks for it. This is the single place that
 * rule lives, so everything that animates agrees.
 */
export function useReducedMotion(): boolean {
  const { motionPreference } = useContext(AppContext);
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = useState(
    () => window.matchMedia?.(QUERY).matches ?? false,
  );

  // Follow OS changes only in System mode; On and Off are explicit overrides.
  useEffect(() => {
    if (motionPreference !== "system") return;
    const mediaQuery = window.matchMedia(QUERY);
    const update = () => setSystemPrefersReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [motionPreference]);

  return (
    motionPreference === "on" ||
    (motionPreference === "system" && systemPrefersReducedMotion)
  );
}
