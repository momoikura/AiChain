"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ORBIT_VERT, ORBIT_FRAG } from "./shaders/trail";
import { makeRingGeometry } from "./Materials";
import { ORBIT_RADIUS, type Palette } from "./constants";
import type { SolarState } from "./state";

/**
 * The orbital path — three concentric hairlines rather than one stroke.
 *
 * A single ring reads as a drawn circle; a set of them at slightly different
 * radii and opacities reads as a physical structure with depth. Each brightens
 * where it passes near the star (light scattering), which is what sells the
 * ring as glass catching light instead of a flat outline.
 */

interface RingSpec {
  inner: number;
  outer: number;
  opacity: number;
}

const RINGS: RingSpec[] = [
  { inner: ORBIT_RADIUS - 0.175, outer: ORBIT_RADIUS - 0.16, opacity: 0.16 },
  { inner: ORBIT_RADIUS - 0.012, outer: ORBIT_RADIUS + 0.012, opacity: 0.34 },
  { inner: ORBIT_RADIUS + 0.15, outer: ORBIT_RADIUS + 0.168, opacity: 0.12 },
];

function Ring({ spec, state, palette }: { spec: RingSpec; state: SolarState; palette: Palette }) {
  const geo = useMemo(() => makeRingGeometry(spec.inner, spec.outer, 200), [spec.inner, spec.outer]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ORBIT_VERT,
        fragmentShader: ORBIT_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(palette.atmos) },
          uOpacity: { value: spec.opacity },
          uProgress: { value: state.progress },
          uGlow: { value: 0 },
        },
      }),
    [palette, spec.opacity, state.progress]
  );

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
    mat.uniforms.uProgress.value = state.progress;
    mat.uniforms.uGlow.value = state.glow;
  });

  return (
    <mesh geometry={geo}>
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

export function Orbit({ state, palette }: { state: SolarState; palette: Palette }) {
  return (
    <>
      {RINGS.map((spec, i) => (
        <Ring key={i} spec={spec} state={state} palette={palette} />
      ))}
    </>
  );
}
