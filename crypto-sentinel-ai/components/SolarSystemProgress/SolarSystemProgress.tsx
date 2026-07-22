"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { AlertLevel } from "@/lib/types";
import { paletteFor, typeScale } from "./constants";
import { createSolarState, damp } from "./state";
import { useTier, useInView, type Tier } from "./useTier";
import { subscribeTick } from "./ticker";
import { LiteCanvas } from "./LiteCanvas";
import { SceneBoundary } from "./SceneBoundary";

/**
 * Three.js and the postprocessing chain load only when a cinematic instance
 * actually mounts — routes rendering only lite tiers never pay for the bundle.
 */
const CinematicCanvas = dynamic(() => import("./CinematicCanvas"), {
  ssr: false,
  loading: () => null,
});

export interface SolarSystemProgressProps {
  /** 0–100. */
  score: number;
  size?: number;
  level?: AlertLevel;
  label?: string;
  /**
   * Force a render tier. Omit to auto-select from size, device class,
   * reduced-motion and the remaining WebGL context budget.
   */
  tier?: Tier;
  /** Accessible name. Defaults to "<label> <score> percent". */
  ariaLabel?: string;
  className?: string;
}

/**
 * A progress indicator rendered as a miniature solar system.
 *
 * Progress is communicated by where the star sits on its orbit — 0% at 12
 * o'clock, advancing clockwise — with the completed arc illuminated and the
 * remainder left dim. Drop-in replacement for the original ConfidenceRing.
 */
export function SolarSystemProgress({
  score,
  size = 120,
  level = "green",
  label = "CONFIDENCE",
  tier: requestedTier,
  ariaLabel,
  className,
}: SolarSystemProgressProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const clamped = Math.max(0, Math.min(100, score));
  const palette = useMemo(() => paletteFor(level), [level]);
  const type = useMemo(() => typeScale(size), [size]);

  const { inView, everSeen } = useInView(hostRef);
  const autoTier = useTier(size, requestedTier, everSeen);
  const tier: Tier = contextLost ? "lite" : autoTier;

  // Shared animation state. Deliberately a ref: every frame of this component
  // mutates it, and routing that through React state would re-render the whole
  // alert list 60 times a second.
  const stateRef = useRef(createSolarState(0));
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    stateRef.current.target = clamped / 100;
    // Any change in value emits an energy pulse the scene reacts to.
    stateRef.current.pulse = Math.min(1, stateRef.current.pulse + 0.55);
  }, [clamped]);

  useEffect(() => {
    stateRef.current.glowTarget = hovered ? 1 : 0;
  }, [hovered]);

  // --- Count-up ---------------------------------------------------------------
  // Driven off the shared ticker so it costs no extra rAF, and eased with the
  // same lambda as the star so the number and the orbit stay in lockstep.
  const [display, setDisplay] = useState(clamped);
  const displayRef = useRef(clamped);
  const staticTier = tier === "static";

  useEffect(() => {
    if (staticTier) {
      displayRef.current = clamped;
      setDisplay(clamped);
      return;
    }
    const settle = () => {
      displayRef.current = clamped;
      setDisplay(clamped);
    };

    // No animation is possible in a hidden tab, so there is no easing worth
    // preserving — show the true value immediately rather than leaving a stale
    // one on screen for the user to find when they switch back.
    if (typeof document !== "undefined" && document.hidden) settle();

    const unsubscribe = subscribeTick((_, dt) => {
      const next = damp(displayRef.current, clamped, 3.1, dt);
      displayRef.current = next;
      const rounded = Math.round(next);
      // Only re-render when the visible integer actually changes.
      setDisplay((prev) => (prev === rounded ? prev : rounded));
    });

    // Correctness guarantee. The count-up is driven by requestAnimationFrame,
    // which browsers suspend entirely in a backgrounded tab — leaving the
    // easing frozen part-way and *displaying a number that is simply wrong*
    // (e.g. 68 when the real score is 80). The animation is decoration; the
    // value is not. Snap to truth if the easing has not converged.
    const snap = window.setTimeout(() => {
      if (Math.abs(displayRef.current - clamped) < 0.5) return;
      settle();
    }, 1400);

    const onVisibility = () => {
      if (document.hidden) settle();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unsubscribe();
      window.clearTimeout(snap);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [clamped, staticTier]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    // Screen Y is inverted relative to world Y.
    pointer.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }, []);

  const onPointerLeave = useCallback(() => {
    pointer.current.x = 0;
    pointer.current.y = 0;
    setHovered(false);
  }, []);

  const handleContextLost = useCallback(() => setContextLost(true), []);

  // --- Render watchdog --------------------------------------------------------
  // A WebGL scene can fail *silently*: a stalled container measurement, a driver
  // hang, or a blocked render loop all produce a live canvas that simply never
  // draws — no error, no lost context, just an empty circle where a score should
  // be. If the scene has not produced its first frame shortly after mounting,
  // demote to the Canvas2D tier. A slightly simpler visual is always better than
  // a blank confidence score.
  const drewRef = useRef(false);
  const handleFirstFrame = useCallback(() => {
    drewRef.current = true;
  }, []);

  useEffect(() => {
    if (tier !== "cinematic") return;
    drewRef.current = false;

    let timer = 0;
    // Only judge the scene while the tab is actually visible: browsers suspend
    // requestAnimationFrame in a hidden tab, so a scene mounted in the
    // background would draw zero frames through no fault of its own and get
    // permanently demoted. Arm the watchdog when visible, disarm when hidden.
    const arm = () => {
      window.clearTimeout(timer);
      if (document.hidden || drewRef.current) return;
      timer = window.setTimeout(() => {
        if (!drewRef.current && !document.hidden) setContextLost(true);
      }, 1500);
    };

    arm();
    document.addEventListener("visibilitychange", arm);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", arm);
    };
  }, [tier]);

  const quality = size >= 140 ? "high" : "medium";

  return (
    <div
      ref={hostRef}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${Math.round(clamped)} percent`}
      aria-label={ariaLabel ?? `${label} ${Math.round(clamped)} percent`}
      // Surfaces the resolved renderer for QA and perf triage.
      data-tier={tier}
      data-in-view={inView ? "1" : "0"}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className ?? ""}`}
      style={{ width: size, height: size, background: "#03060a" }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
    >
      {/* Renderer layer */}
      {everSeen && tier === "cinematic" ? (
        <div className="absolute inset-0">
          <SceneBoundary onError={handleContextLost}>
          <CinematicCanvas
            state={stateRef.current}
            palette={palette}
            pointer={pointer}
            active={inView}
            quality={quality}
            size={size}
            onFirstFrame={handleFirstFrame}
            onContextLost={handleContextLost}
          />
          </SceneBoundary>
        </div>
      ) : (
        <LiteCanvas
          score={clamped}
          size={size}
          level={level}
          animated={tier === "lite" && inView}
          hovered={hovered}
        />
      )}

      {/* Readout. Kept in the DOM rather than drawn into the scene: text stays
          crisp at any DPR, inherits the app's font, and remains selectable and
          legible to assistive tech. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="tabular font-bold leading-none"
          style={{
            fontSize: type.value,
            color: palette.key,
            // Dual shadow: the tight one guarantees contrast against a bright
            // planet, the wide one ties the type into the scene's bloom.
            textShadow: `0 1px 3px rgba(0,0,0,0.92), 0 0 14px ${palette.key}55`,
          }}
        >
          {Math.round(display)}
        </span>
        <span
          className="mt-[0.35em] font-semibold uppercase leading-none text-white/55"
          style={{
            fontSize: type.label,
            letterSpacing: `${type.labelTracking}em`,
            textShadow: "0 1px 3px rgba(0,0,0,0.95)",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export default SolarSystemProgress;
