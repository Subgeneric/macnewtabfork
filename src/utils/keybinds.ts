/**
 * Keyboard shortcut helpers.
 *
 * Combos are stored as "Modifier+...+Code" using KeyboardEvent.code (not
 * .key), e.g. "Alt+Shift+KeyL". `code` is layout/modifier independent, so
 * Option+letter on macOS (which types special characters) still matches.
 */

export const KEYBIND_ACTIONS = [
  "launchpad",
  "appStore",
  "todo",
  "stickyNote",
  "focusMode",
  "freeform",
  "screenRecorder",
  "settings",
  "tabManager",
] as const;

export type KeybindAction = (typeof KEYBIND_ACTIONS)[number];
export type Keybinds = Partial<Record<KeybindAction, string>>;

// Alt+Shift+<letter>: avoids Chrome's own Ctrl/Alt-only shortcuts as far as possible.
export const DEFAULT_KEYBINDS: Keybinds = {
  launchpad: "Alt+Shift+KeyL",
  appStore: "Alt+Shift+KeyP",
  todo: "Alt+Shift+KeyO",
  stickyNote: "Alt+Shift+KeyN",
  focusMode: "Alt+Shift+KeyF",
  freeform: "Alt+Shift+KeyD",
  screenRecorder: "Alt+Shift+KeyR",
  settings: "Alt+Shift+KeyS",
  tabManager: "Alt+Shift+KeyM",
};

const MODIFIER_CODES = new Set([
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "ShiftLeft",
  "ShiftRight",
  "MetaLeft",
  "MetaRight",
]);

/** Turn a keydown event into a combo string, or null for a bare modifier / no modifier. */
export function eventToCombo(e: KeyboardEvent): string | null {
  if (MODIFIER_CODES.has(e.code) || !e.code) return null;
  // Require Ctrl, Alt or Meta so a shortcut can never swallow normal typing.
  if (!(e.ctrlKey || e.altKey || e.metaKey)) return null;
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (e.metaKey) parts.push("Meta");
  parts.push(e.code);
  return parts.join("+");
}

/** Human readable label, e.g. "Alt+Shift+KeyL" -> "Alt + Shift + L". */
export function formatCombo(combo: string | undefined): string {
  if (!combo) return "";
  return combo
    .split("+")
    .map((p) => p.replace(/^Key/, "").replace(/^Digit/, ""))
    .join(" + ");
}

const VALID_MODIFIERS = new Set(["Ctrl", "Alt", "Shift", "Meta"]);
const KEY_CODE_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/;

/** Reject malformed persisted shortcuts before they reach the event handler or UI. */
function isValidCombo(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;

  const parts = value.split("+");
  if (parts.length < 2) return false;

  const keyCode = parts[parts.length - 1];
  if (
    !KEY_CODE_PATTERN.test(keyCode) ||
    VALID_MODIFIERS.has(keyCode) ||
    MODIFIER_CODES.has(keyCode)
  ) {
    return false;
  }

  const modifiers = parts.slice(0, -1);
  if (
    modifiers.some((modifier) => !VALID_MODIFIERS.has(modifier)) ||
    new Set(modifiers).size !== modifiers.length ||
    !modifiers.some((modifier) => modifier === "Ctrl" || modifier === "Alt" || modifier === "Meta")
  ) {
    return false;
  }

  return true;
}

export function isValidKeybinds(val: unknown): val is Keybinds {
  if (!val || typeof val !== "object" || Array.isArray(val)) return false;

  const entries = Object.entries(val);
  return entries.every(
    ([action, combo]) =>
      KEYBIND_ACTIONS.includes(action as KeybindAction) && isValidCombo(combo),
  );
}

export function findActionForEvent(
  e: KeyboardEvent,
  keybinds: Keybinds,
): KeybindAction | null {
  const combo = eventToCombo(e);
  if (!combo) return null;
  for (const action of KEYBIND_ACTIONS) {
    if (keybinds[action] === combo) return action;
  }
  return null;
}

function isMacPlatform(): boolean {
  return (
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("mac")
  );
}

/**
 * Whether a keydown inside a text field should be left to the field instead
 * of triggering a shortcut. Call it only when the event target is an input,
 * textarea or contenteditable.
 *
 * Shortcuts normally win over the field, but not when that would eat text the
 * person is typing:
 * - Ctrl-only (or Shift-only) combos are editing shortcuts: copy, paste,
 *   select all, undo...
 * - AltGr is how many layouts type characters (it can show up as Ctrl+Alt).
 * - On macOS, Option(+Shift)+key types special characters (on a US layout
 *   Option+L is "¬" and Option+Shift+L is "Ò"; other layouts use Option for
 *   accented letters), so those keystrokes stay with the field. Cmd and Ctrl
 *   combos are commands on macOS, not text.
 *
 * Trade-off: on macOS, Option-based shortcuts don't fire while a text field
 * has focus. Click outside the field first.
 */
export function shouldLeaveToTextField(e: KeyboardEvent): boolean {
  if (!(e.altKey || e.metaKey)) return true;
  if (e.getModifierState("AltGraph")) return true;
  if (isMacPlatform() && e.altKey && !e.metaKey && !e.ctrlKey) return true;
  return false;
}
