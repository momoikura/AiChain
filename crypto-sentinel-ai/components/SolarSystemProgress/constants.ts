import type { AlertLevel } from "@/lib/types";

/**
 * Shared scene constants. Kept in one place so the WebGL ("cinematic") and
 * Canvas2D ("lite") renderers stay visually identical — the lite tier is a
 * faithful 2D projection of the same solar system, not a different design.
 */

export const TAU = Math.PI * 2;

/** Orbit plane tilt, radians. Enough for real perspective, shallow enough that
 *  the ring still reads instantly as a progress indicator. */
export const ORBIT_TILT = 0.42;

export const PLANET_RADIUS = 1;
export const ORBIT_RADIUS = 1.86;

/** Per-level palette. Linear-space friendly; matches the terminal theme. */
export interface Palette {
  /** Dominant hue — star core, completed orbit, text. */
  key: string;
  /** Planet landmass. */
  land: string;
  /** Planet ocean / low-roughness regions. */
  ocean: string;
  /** Atmospheric rim scatter. */
  atmos: string;
  /** Star corona outer falloff. */
  corona: string;
}

export const PALETTES: Record<AlertLevel, Palette> = {
  green: {
    key: "#22e39b",
    land: "#0e3b30",
    ocean: "#05191c",
    atmos: "#4dffc3",
    corona: "#7cffd4",
  },
  yellow: {
    key: "#f5c542",
    land: "#3d2f0c",
    ocean: "#1c1405",
    atmos: "#ffe08a",
    corona: "#ffd978",
  },
  red: {
    key: "#ff5470",
    land: "#3f1120",
    ocean: "#1b060d",
    atmos: "#ff90a6",
    corona: "#ff8fa3",
  },
};

export function paletteFor(level: AlertLevel): Palette {
  return PALETTES[level] ?? PALETTES.green;
}

/** Deep-space background. Never pure black — real space photography never is. */
export const SPACE_BG = "#03060a";

/**
 * Position on the orbit for a given progress (0..1).
 * 0 = top (12 o'clock), increasing clockwise, matching the original SVG ring.
 * Returned in the orbit's local XY plane; the parent group applies ORBIT_TILT.
 */
export function orbitPoint(progress: number, radius = ORBIT_RADIUS) {
  const phi = progress * TAU;
  return { x: Math.sin(phi) * radius, y: Math.cos(phi) * radius };
}

/** Typography scale derived from component size so every breakpoint stays balanced. */
export function typeScale(size: number) {
  return {
    value: Math.round(size * 0.3),
    label: Math.max(7, Math.round(size * 0.093)),
    labelTracking: size * 0.012,
  };
}
