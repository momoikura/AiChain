"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TRAIL_VERT, TRAIL_FRAG } from "./shaders/trail";
import { makeRingGeometry } from "./Materials";
import { ORBIT_RADIUS, type Palette } from "./constants";
import type { SolarState } from "./state";

/**
 * Ionised plasma trail and completed-arc illumination.
 *
 * The entire progress state is one uniform (`uProgress`) evaluated per-fragment
 * against each vertex's angle, so updating progress never rebuilds geometry —
 * it is a single float upload per frame regardless of ring resolution.
 */
export function PlasmaTrail({ state, palette }: { state: SolarState; palette: Palette }) {
  // Wider band than the guide rings so the trail reads as volume, not a line.
  const geo = useMemo(() => makeRingGeometry(ORBIT_RADIUS - 0.075, ORBIT_RADIUS + 0.075, 320), []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: TRAIL_VERT,
        fragmentShader: TRAIL_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: state.progress },
          uKey: { value: new THREE.Color(palette.key) },
          uDim: { value: new THREE.Color(palette.ocean) },
          uGlow: { value: 0 },
          uPulse: { value: 0 },
        },
      }),
    [palette, state.progress]
  );

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
    mat.uniforms.uProgress.value = state.progress;
    mat.uniforms.uGlow.value = state.glow;
    mat.uniforms.uPulse.value = state.pulse;
  });

  return (
    <mesh geometry={geo}>
      <primitive object={mat} attach="material" />
    </mesh>
  );
}
