"use client";

import { MatrixRain } from "./MatrixRain";

/**
 * App-wide ambient layer: Matrix rain behind everything + CRT scanlines,
 * vignette and a slow scan bar on top. All fixed + pointer-events:none so it
 * never interferes with interaction. Content panels use opaque-ish glass so
 * text stays readable over the rain.
 */
export function CyberBackdrop({ rainOpacity = 0.4 }: { rainOpacity?: number }) {
  return (
    <>
      {/* Rain — behind all content */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{ opacity: rainOpacity }}
      >
        <MatrixRain opacity={0.7} fontSize={15} fps={22} />
      </div>
      {/* Faint cyber grid */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-grid-faint"
        style={{ backgroundSize: "42px 42px", opacity: 0.5 }}
      />
      {/* CRT overlays */}
      <div aria-hidden className="crt-overlay" />
      <div aria-hidden className="crt-vignette" />
      <div aria-hidden className="crt-scan" />
    </>
  );
}
