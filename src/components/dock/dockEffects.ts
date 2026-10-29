/**
 * macOS-style dock animations: magnification toward the pointer, and a hop
 * when an icon is clicked. Plain DOM so it can be tested without React; the
 * visuals live in Dock.css (the `.dock-effects` class on `.dock-container`).
 */

/** Largest scale an icon reaches. Kept low enough that neighbours never overlap. */
export const MAX_SCALE = 1.35;
/** How far the magnification reaches, in icon spacings. */
export const RADIUS_IN_ITEMS = 2.2;

/**
 * Scale for an icon whose centre is `distance` px from the pointer: MAX_SCALE
 * right under it, easing (cosine) back to 1 at `radius` and beyond.
 */
export function magnifyScale(
  distance: number,
  radius: number,
  maxScale = MAX_SCALE,
): number {
  if (!(radius > 0) || distance >= radius) return 1;
  const t = Math.max(0, distance) / radius;
  return 1 + ((maxScale - 1) * (Math.cos(Math.PI * t) + 1)) / 2;
}

const SCALE_VAR = "--dock-s";
const BOUNCE_CLASS = "dock-bounce";
const DEFAULT_SPACING = 58;

// Dividers don't magnify, as on macOS
const isIcon = (el: Element): el is HTMLElement =>
  el instanceof HTMLElement && !el.classList.contains("dock-divider");

const icons = (container: HTMLElement) =>
  Array.from(container.children).filter(isIcon);

/**
 * Starts the effects on a dock container. `horizontal` is true for a dock
 * along the bottom edge. Returns a function that stops them and restores the
 * icons.
 */
export function attachDockEffects(
  container: HTMLElement,
  horizontal: boolean,
): () => void {
  let pointer = 0;
  let frame = 0;

  const update = () => {
    frame = 0;
    const items = icons(container);
    const centres = items.map((el) => {
      const r = el.getBoundingClientRect();
      return horizontal ? (r.left + r.right) / 2 : (r.top + r.bottom) / 2;
    });
    // Scaling grows icons about their anchored edge, so their centres along
    // the dock stay put and the spacing measured here is stable.
    const spacing =
      centres.length > 1
        ? (centres[centres.length - 1] - centres[0]) / (centres.length - 1)
        : DEFAULT_SPACING;
    const radius = Math.abs(spacing) * RADIUS_IN_ITEMS;
    items.forEach((el, i) => {
      const scale = magnifyScale(Math.abs(centres[i] - pointer), radius);
      el.style.setProperty(SCALE_VAR, scale.toFixed(3));
    });
  };

  const onMove = (event: MouseEvent) => {
    pointer = horizontal ? event.clientX : event.clientY;
    if (!frame) frame = requestAnimationFrame(update);
  };

  const reset = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    icons(container).forEach((el) => el.style.removeProperty(SCALE_VAR));
  };

  const onClick = (event: MouseEvent) => {
    let el = event.target as HTMLElement | null;
    while (el && el.parentElement !== container) el = el.parentElement;
    if (!el || !isIcon(el)) return;

    const target = el;
    const done = () => target.classList.remove(BOUNCE_CLASS);
    target.classList.remove(BOUNCE_CLASS);
    void target.offsetWidth; // restart the animation on repeat clicks
    target.classList.add(BOUNCE_CLASS);
    target.addEventListener("animationend", done, { once: true });
  };

  container.addEventListener("mousemove", onMove);
  container.addEventListener("mouseleave", reset);
  container.addEventListener("click", onClick);

  return () => {
    container.removeEventListener("mousemove", onMove);
    container.removeEventListener("mouseleave", reset);
    container.removeEventListener("click", onClick);
    reset();
    icons(container).forEach((el) => el.classList.remove(BOUNCE_CLASS));
  };
}
