"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Planet } from "./Planet";
import { Orbit } from "./Orbit";
import { Star } from "./Star";
import { PlasmaTrail } from "./PlasmaTrail";
import { Nebula } from "./Nebula";
import { Particles } from "./Particles";
import { CameraRig } from "./CameraRig";
import { Lighting } from "./Lighting";
import { ORBIT_TILT, type Palette } from "./constants";
import { damp, type SolarState } from "./state";

/**
 * Scene graph.
 *
 * The orbit, trail and star all live inside one tilted group, so a single
 * rotation gives the whole orbital system correct perspective and the star
 * naturally passes behind the planet at the top of its path — real occlusion
 * from the depth buffer, not a painted illusion.
 */
export function Scene({
  state,
  palette,
  pointer,
  quality,
  onFirstFrame,
}: {
  state: SolarState;
  palette: Palette;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  quality: "high" | "medium";
  /** Fired once the scene has actually drawn, so the host can clear its watchdog. */
  onFirstFrame: () => void;
}) {
  const wasComplete = useRef(state.completed);
  const frames = useRef(0);

  const counts = useMemo(
    () =>
      quality === "high"
        ? { stars: 420, dust: 180, bloom: 0.62 }
        : { stars: 200, dust: 90, bloom: 0.5 },
    [quality]
  );

  useFrame(({ gl }, dt) => {
    const d = Math.min(dt, 0.05);

    frames.current += 1;
    if (frames.current === 1) onFirstFrame();

    if (process.env.NODE_ENV !== "production" && frames.current % 30 === 0) {
      // Cheap on-DOM telemetry for perf triage; DOM is readable from tooling
      // contexts where console capture and the dev overlay are not.
      document.body.dataset.solarFrames = String(frames.current);
      document.body.dataset.solarDraws = String(gl.info.render.calls);
    }

    // Ease progress toward target. Slower lambda than the hover damping so a
    // value change reads as the star *flying* around the orbit.
    state.progress = damp(state.progress, state.target, 3.1, d);
    state.glow = damp(state.glow, state.glowTarget, 6.0, d);

    // Pulse decays exponentially once fired.
    state.pulse = damp(state.pulse, 0, 3.4, d);

    // Completion fires exactly once, and re-arms if progress later drops.
    const complete = state.target >= 0.999;
    if (complete && !wasComplete.current) {
      state.pulse = 1;
      wasComplete.current = true;
    } else if (!complete) {
      wasComplete.current = false;
    }
  });

  return (
    <>
      <CameraRig state={state} pointer={pointer} />
      <Lighting state={state} />

      <Nebula palette={palette} intensity={quality === "high" ? 1 : 0.75} />
      <Particles state={state} palette={palette} starCount={counts.stars} dustCount={counts.dust} />

      <Planet state={state} palette={palette} />

      <group rotation={[-ORBIT_TILT, 0, 0]}>
        <Orbit state={state} palette={palette} />
        <PlasmaTrail state={state} palette={palette} />
        <Star state={state} palette={palette} />
      </group>

      {/* Bloom only. SSAO was evaluated and rejected: at this component's
          on-screen size the occlusion it resolves is under a pixel, and the
          extra depth+normal passes cost more than the planet shader itself. */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={counts.bloom}
          luminanceThreshold={0.62}
          luminanceSmoothing={0.28}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}
