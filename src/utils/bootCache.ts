/**
 * Tiny per-space cache read by public/boot.js *before* React loads.
 *
 * The custom wallpaper lives in IndexedDB, which can't be read synchronously
 * at boot. So whenever a wallpaper is set we also keep a ~48px JPEG thumbnail
 * in localStorage; the boot skeleton paints it blurred, so the loading
 * screen looks like your own wallpaper instead of a generic placeholder.
 *
 * This is a derived cache, not a user setting: it is rebuilt automatically,
 * so it is intentionally NOT in PER_SPACE_KEYS or the data export.
 * Keep the key and shape in sync with public/boot.js.
 */

const BOOT_CACHE_KEY = "boot_cache";
const THUMB_WIDTH = 48;

type BootCache = Record<string, { thumb?: string }>;

function readCache(): BootCache {
  try {
    const parsed = JSON.parse(localStorage.getItem(BOOT_CACHE_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function writeCache(cache: BootCache): void {
  try {
    localStorage.setItem(BOOT_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // storage blocked or full: the skeleton just falls back to the theme colour
  }
}

export function hasWallpaperThumb(spaceId: string): boolean {
  return !!readCache()[spaceId]?.thumb;
}

export function clearWallpaperThumb(spaceId: string): void {
  const cache = readCache();
  if (!cache[spaceId]) return;
  delete cache[spaceId];
  writeCache(cache);
}

const inFlight = new Set<string>();

/** Downscale the wallpaper at `src` (a blob/object URL) and cache it for boot. */
export async function saveWallpaperThumb(
  spaceId: string,
  src: string,
): Promise<void> {
  if (inFlight.has(spaceId)) return;
  inFlight.add(spaceId);
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    if (!img.naturalWidth || !img.naturalHeight) return;

    const width = THUMB_WIDTH;
    const height = Math.max(
      1,
      Math.round((width * img.naturalHeight) / img.naturalWidth),
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, width, height);

    const cache = readCache();
    cache[spaceId] = { thumb: canvas.toDataURL("image/jpeg", 0.6) };
    writeCache(cache);
  } catch {
    // undecodable image etc.: not worth failing the app over
  } finally {
    inFlight.delete(spaceId);
  }
}
