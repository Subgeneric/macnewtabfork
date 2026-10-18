import React, { lazy, memo, Suspense, useMemo } from "react";

const themeComponents: Record<
  string,
  React.LazyExoticComponent<React.ComponentType>
> = {
  particles: lazy(
    () => import("./interactive-themes/ParticlesInteractiveTheme"),
  ),
  hexagon: lazy(() => import("./interactive-themes/HexagonGridTheme")),
  waves: lazy(() => import("./interactive-themes/WavesInteractiveTheme")),
  fluid: lazy(() => import("./interactive-themes/FluidTheme")),
  constellation: lazy(() => import("./interactive-themes/ConstellationTheme")),
  globe: lazy(() => import("./interactive-themes/GlobeTheme")),
  net: lazy(() => import("./interactive-themes/NetTheme")),
  snowfall: lazy(() => import("./interactive-themes/SnowfallTheme")),
  fireworks: lazy(() => import("./interactive-themes/FireworksTheme")),
  ripples: lazy(() => import("./interactive-themes/RipplesTheme")),
  tunnel: lazy(() => import("./interactive-themes/TunnelTheme")),
  "space-globes": lazy(() => import("./interactive-themes/SpaceGlobesTheme")),
  breakout: lazy(() => import("./interactive-themes/BreakoutTheme")),
};

// Default fallback theme key
const DEFAULT_THEME = "particles";

interface InteractiveWallpaperProps {
  theme: string;
}

const InteractiveWallpaper: React.FC<InteractiveWallpaperProps> = memo(
  ({ theme }) => {
    const ThemeComponent = useMemo(
      () => themeComponents[theme] || themeComponents[DEFAULT_THEME],
      [theme],
    );

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
          overflow: "hidden",
        }}
      >
        <Suspense fallback={null}>
          <ThemeComponent />
        </Suspense>
      </div>
    );
  },
);

export default InteractiveWallpaper;
