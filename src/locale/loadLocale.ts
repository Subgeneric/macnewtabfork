import { translation } from "./languages";

type LocaleModule = { default: Record<string, string> };

// One dynamic import per language, so each ends up in its own chunk and only
// the active language is ever fetched. English is bundled in languages.ts.
const loaders: Record<string, () => Promise<LocaleModule>> = {
  kn: () => import("./lang/kn"),
  cs: () => import("./lang/cs"),
  tr: () => import("./lang/tr"),
  vi: () => import("./lang/vi"),
  uz: () => import("./lang/uz"),
  zh: () => import("./lang/zh"),
  hi: () => import("./lang/hi"),
  it: () => import("./lang/it"),
  bn: () => import("./lang/bn"),
  pt: () => import("./lang/pt"),
  fr: () => import("./lang/fr"),
  ru: () => import("./lang/ru"),
  es: () => import("./lang/es"),
  ja: () => import("./lang/ja"),
  ko: () => import("./lang/ko"),
  id: () => import("./lang/id"),
  mr: () => import("./lang/mr"),
  pl: () => import("./lang/pl"),
  de: () => import("./lang/de"),
};

const inFlight = new Map<string, Promise<boolean>>();

/** True once the strings for `code` are in `translation` and safe to read. */
export function isLocaleLoaded(code: string): boolean {
  return !!translation[code];
}

/**
 * Loads a language into `translation`. Resolves true when the language is
 * available afterwards, false if it is unknown or its chunk failed to load.
 */
export function loadLocale(code: string): Promise<boolean> {
  if (isLocaleLoaded(code)) return Promise.resolve(true);
  const loader = loaders[code];
  if (!loader) return Promise.resolve(false);

  let pending = inFlight.get(code);
  if (!pending) {
    pending = loader()
      .then((module) => {
        translation[code] = module.default;
        return true;
      })
      .catch(() => false)
      .finally(() => {
        inFlight.delete(code);
      });
    inFlight.set(code, pending);
  }
  return pending;
}
