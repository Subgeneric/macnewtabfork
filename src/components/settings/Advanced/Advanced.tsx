import React, { useContext } from "react";
import "../general/General.css";
import { AppContext } from "../../../context/provider";
import Translation from "../../../locale/Translation";
import Toggle from "../../toggle/Toggle";
import { Select } from "../../select/Select";
import Keybinds from "../Keybinds/Keybinds";
import { DockIconEffect, QualityPreset } from "../../../static/generalSettings";

export default function Advanced() {
  const {
    enableLoadAnimation,
    setEnableLoadAnimation,
    loadAnimationType,
    setLoadAnimationType,
    qualityPreset,
    setQualityPreset,
    reduceMotion,
    setReduceMotion,
    dockIconEffect,
    setDockIconEffect,
  } = useContext(AppContext);

  return (
    <div className="general__container">
      <div className="general__row-item advanced-support-row">
        <div className="advanced-support-text">
          <span className="advanced-support-emoji">☕</span>
          <div>
            <Translation value="support_description" />
          </div>
        </div>
        <a
          className="advanced-support-link"
          href="https://www.buymeacoffee.com/amithb"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
            alt="Buy Me A Coffee"
          />
        </a>
      </div>

      <div className="general__row-item">
        <Translation value="enable_load_animation" />
        <Toggle
          id="load-animation-toggle"
          name="Load animation toggle"
          isChecked={enableLoadAnimation}
          handleToggleChange={() =>
            setEnableLoadAnimation(!enableLoadAnimation)
          }
        />
      </div>

      <div
        className={`general__row-item ${!enableLoadAnimation ? "disabled" : ""}`}
      >
        <Translation value="animation_type" />
        <Select
          id="animation-type-select"
          name="Animation type select"
          options={[
            { value: "crt-wake-up", label: "CRT Wake-up" },
            { value: "fade-in", label: "Fade In" },
            { value: "scale-up", label: "Scale Up" },
            { value: "chromatic-shift", label: "Chromatic Shift" },
            { value: "iris-reveal", label: "Iris Reveal" },
            { value: "camera-focus", label: "Camera Focus" },
            { value: "tv-static-burst", label: "TV Static Burst" },
            { value: "float-in", label: "Float In" },
          ]}
          value={loadAnimationType}
          onChange={(event) => setLoadAnimationType(event.target.value)}
        />
      </div>

      <div className="general__row-item">
        <Translation value="quality_preset" />
        <Select
          id="quality-preset-select"
          name="Quality preset select"
          options={[
            {
              value: "high",
              label: <Translation value="quality_preset_high" />,
            },
            {
              value: "balanced",
              label: <Translation value="quality_preset_balanced" />,
            },
            {
              value: "lite",
              label: <Translation value="quality_preset_lite" />,
            },
          ]}
          value={qualityPreset}
          onChange={(event) =>
            setQualityPreset(event.target.value as QualityPreset)
          }
        />
      </div>

      <div className="general__row-item">
        <Translation value="reduce_motion" />
        <Toggle
          id="reduce-motion-toggle"
          name="Reduce motion toggle"
          isChecked={reduceMotion}
          handleToggleChange={() => setReduceMotion(!reduceMotion)}
        />
      </div>

      <div className="general__row-item">
        <Translation value="dock_icon_effect" />
        <Select
          id="dock-icon-effect-select"
          name="Dock icon effect select"
          options={[
            {
              value: "none",
              label: <Translation value="dock_icon_effect_none" />,
            },
            {
              value: "pop",
              label: <Translation value="dock_icon_effect_pop" />,
            },
            {
              value: "wave",
              label: <Translation value="dock_icon_effect_wave" />,
            },
          ]}
          value={dockIconEffect}
          onChange={(event) =>
            setDockIconEffect(event.target.value as DockIconEffect)
          }
        />
      </div>

      <Keybinds />
    </div>
  );
}
