import React, { lazy, memo, Suspense, useMemo } from "react";
import "./DynamicWallpaper.css";

// Map them
const themeComponents: Record<
  string,
  React.LazyExoticComponent<React.ComponentType>
> = {
  // Existing
  sunset: lazy(() => import("./themes/SunsetTheme")),
  hyper: lazy(() => import("./themes/HyperTheme")),
  grid: lazy(() => import("./themes/GridTheme")),
  matrix: lazy(() => import("./themes/MatrixTheme")),
  particles: lazy(() => import("./themes/ParticlesTheme")),
  waves: lazy(() => import("./themes/WavesTheme")),

  // Nature
  "circuit-2": lazy(() => import("./themes/CircuitTwoTheme")),
  snow: lazy(() => import("./themes/SnowTheme")),
  clouds: lazy(() => import("./themes/CloudsTheme")),
  fireflies: lazy(() => import("./themes/FirefliesTheme")),
  "star-zoom": lazy(() => import("./themes/StarZoomTheme")),

  // Sci-Fi
  circuit: lazy(() => import("./themes/CircuitTheme")),
  dna: lazy(() => import("./themes/DNATheme")),
  wormhole: lazy(() => import("./themes/WormholeTheme")),

  // Abstract
  plasma: lazy(() => import("./themes/PlasmaTheme")),
  lava: lazy(() => import("./themes/LavaTheme")),
  fog: lazy(() => import("./themes/FogTheme")),

  // Geometric
  hexagons: lazy(() => import("./themes/HexagonsTheme")),
  cubes: lazy(() => import("./themes/CubesTheme")),
  tunnel: lazy(() => import("./themes/TunnelTheme")),
  net: lazy(() => import("./themes/NetTheme")),
  globe: lazy(() => import("./themes/GlobeTheme")),
};

// Default fallback theme key
const DEFAULT_THEME = "sunset";

interface DynamicWallpaperProps {
  theme: string;
}

const DynamicWallpaper: React.FC<DynamicWallpaperProps> = memo(({ theme }) => {
  const ThemeComponent = useMemo(
    () => themeComponents[theme] || themeComponents[DEFAULT_THEME],
    [theme],
  );

  return (
    <div className="dynamic-wallpaper-container">
      <div className={`dynamic-wallpaper ${theme}`}>
        {ThemeComponent && (
          <Suspense fallback={null}>
            <ThemeComponent />
          </Suspense>
        )}
      </div>
    </div>
  );
});

export default DynamicWallpaper;
