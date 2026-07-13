"use client";

import { MatrixRain } from "@/components/fx/MatrixRain";

/**
 * Auth-screen backdrop: Matrix rain + cyber grid + CRT scanlines/vignette.
 * Sits behind the auth card; pointer-events:none.
 */
export function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Matrix rain */}
      <div className="absolute inset-0 opacity-45">
        <MatrixRain opacity={0.7} fontSize={16} fps={24} />
      </div>

      {/* Cyber grid */}
      <div
        className="absolute inset-0 bg-grid-faint"
        style={{ backgroundSize: "40px 40px", opacity: 0.6 }}
      />

      {/* Corner glows */}
      <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-signal-green/10 blur-[130px] animate-aurora" />
      <div className="absolute -right-40 top-10 h-[460px] w-[460px] rounded-full bg-accent-cyan/10 blur-[130px] animate-auroraSlow" />

      {/* CRT overlays */}
      <div className="crt-overlay" />
      <div className="crt-vignette" />
      <div className="crt-scan" />
    </div>
  );
}
