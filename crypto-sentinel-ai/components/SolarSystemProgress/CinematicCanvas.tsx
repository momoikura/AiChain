"use client";

import { useCallback, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Scene } from "./Scene";
import type { Palette } from "./constants";
import type { SolarState } from "./state";

/**
 * WebGL host for the cinematic tier.
 *
 * Split from SolarSystemProgress so it can be code-split behind next/dynamic —
 * three.js and the postprocessing chain never enter the initial bundle for
 * routes that only ever render the lite tier.
 */
export default function CinematicCanvas({
  state,
  palette,
  pointer,
  active,
  quality,
  size,
  onFirstFrame,
  onContextLost,
}: {
  state: SolarState;
  palette: Palette;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  active: boolean;
  quality: "high" | "medium";
  /** Expected CSS size in px — used to detect a stalled measurement. */
  size: number;
  onFirstFrame: () => void;
  onContextLost: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  // R3F measures its container with a ResizeObserver. When the component mounts
  // inside a lazily-loaded chunk the first measurement can land before layout,
  // and because the box never actually resizes afterwards the observer never
  // fires again — leaving the canvas at its 300x150 default and rendering a
  // black frame. Nudge a resize until the canvas reports the size we know it
  // should be, then stop. Same failure the other three.js scenes in this
  // codebase work around; generalised here against the expected size rather
  // than a hard-coded threshold, since this component renders small.
  useEffect(() => {
    if (!active) return;
    let n = 0;
    const id = window.setInterval(() => {
      const c = wrapRef.current?.querySelector("canvas");
      const correct = c && Math.abs(c.clientWidth - size) <= 2 && c.clientWidth > 0;
      if (correct || ++n > 12) {
        window.clearInterval(id);
        return;
      }
      window.dispatchEvent(new Event("resize"));
    }, 180);
    return () => window.clearInterval(id);
  }, [active, size]);
  const handleCreated = useCallback(
    ({ gl }: { gl: THREE.WebGLRenderer }) => {
      // Filmic tone mapping + a slightly lifted exposure: without it the bloom
      // clips to flat white instead of rolling off the way real optics do.
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.05;

      // If the browser reclaims this context (too many live contexts, GPU reset,
      // driver hiccup) fall back to the Canvas2D tier rather than showing black.
      gl.domElement.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        onContextLost();
      });
    },
    [onContextLost]
  );

  return (
    <div ref={wrapRef} style={{ width: "100%", height: "100%" }}>
    <Canvas
      // Cap DPR at 1.75: past that the extra fragment cost buys nothing visible
      // on a component this size, and it is the single biggest mobile win.
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 5.35], fov: 32, near: 0.1, far: 60 }}
      gl={{
        antialias: false, // bloom + the soft palette hide edge aliasing
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      // Offscreen instances stop rendering entirely.
      frameloop={active ? "always" : "never"}
      onCreated={handleCreated}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#03060a"]} />
      <Scene
        state={state}
        palette={palette}
        pointer={pointer}
        quality={quality}
        onFirstFrame={onFirstFrame}
      />
    </Canvas>
    </div>
  );
}
