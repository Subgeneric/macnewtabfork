import { useContext, useEffect, useState } from "react";
import "../general/General.css";
import "./Keybinds.css";
import { AppContext } from "../../../context/provider";
import Translation from "../../../locale/Translation";
import Toggle from "../../toggle/Toggle";
import {
  DEFAULT_KEYBINDS,
  KEYBIND_ACTIONS,
  KeybindAction,
  eventToCombo,
  formatCombo,
} from "../../../utils/keybinds";

const ACTION_LABEL_KEYS: Record<KeybindAction, string> = {
  launchpad: "launchpad",
  appStore: "app_store",
  todo: "todo",
  stickyNote: "keybind_new_sticky_note",
  focusMode: "focus_mode",
  freeform: "freeform",
  screenRecorder: "keybind_screen_recorder",
  settings: "keybind_open_settings",
  tabManager: "tab_manager",
};

export default function Keybinds() {
  const { keybindsEnabled, setKeybindsEnabled, keybinds, setKeybinds } =
    useContext(AppContext);
  const [recording, setRecording] = useState<KeybindAction | null>(null);

  // While recording, capture the next combo before anything else sees it
  useEffect(() => {
    if (!recording) return;
    document.documentElement.setAttribute("data-recording-keybind", "");

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setRecording(null);
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        const next = { ...keybinds };
        delete next[recording];
        setKeybinds(next);
        setRecording(null);
        return;
      }
      const combo = eventToCombo(e);
      if (!combo) return; // bare modifier or no Ctrl/Alt/Cmd: keep waiting

      const next = { ...keybinds };
      // A combo can only trigger one action: take it from any other
      KEYBIND_ACTIONS.forEach((action) => {
        if (next[action] === combo) delete next[action];
      });
      next[recording] = combo;
      setKeybinds(next);
      setRecording(null);
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.documentElement.removeAttribute("data-recording-keybind");
    };
  }, [recording, keybinds, setKeybinds]);

  return (
    <>
      <div className="general__row-item">
        <Translation value="enable_keybinds" />
        <Toggle
          id="keybinds-toggle"
          name="Keyboard shortcuts toggle"
          isChecked={keybindsEnabled}
          handleToggleChange={() => setKeybindsEnabled(!keybindsEnabled)}
        />
      </div>

      {keybindsEnabled && (
        <>
          <div className="keybinds__hint">
            <Translation value="keybinds_hint" />
          </div>
          {KEYBIND_ACTIONS.map((action) => {
            const isRecording = recording === action;
            const combo = keybinds[action];
            return (
              <div className="general__row-item" key={action}>
                <Translation value={ACTION_LABEL_KEYS[action]} />
                <button
                  type="button"
                  className={
                    "keybinds__key-button" +
                    (isRecording ? " recording" : "") +
                    (!combo && !isRecording ? " empty" : "")
                  }
                  onClick={() => setRecording(isRecording ? null : action)}
                  onBlur={() => isRecording && setRecording(null)}
                >
                  {isRecording ? (
                    <Translation value="keybind_press_keys" />
                  ) : combo ? (
                    formatCombo(combo)
                  ) : (
                    <Translation value="keybind_not_set" />
                  )}
                </button>
              </div>
            );
          })}
          <div className="general__row-item">
            <span />
            <button
              type="button"
              className="button"
              onClick={() => setKeybinds(DEFAULT_KEYBINDS)}
            >
              <Translation value="reset" />
            </button>
          </div>
        </>
      )}
    </>
  );
}
