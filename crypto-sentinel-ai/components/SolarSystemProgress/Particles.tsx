"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { STARS_VERT, STARS_FRAG, DUST_VERT, DUST_FRAG } from "./shaders/space";
import { makeStarfieldGeometry, makeDustGeometry } from "./Materials";
import { type Palette } from "./constants";
import type { SolarState } from "./state";

/**
 * Starfield and orbital dust.
 *
 * Both are single draw calls whose motion is evaluated entirely in the vertex
 * shader from `uTime`. No per-frame attribute uploads, no CPU particle loop —
 * the cost is effectively flat regardless of particle count.
 */

function Starfield({ palette, count }: { palette: Palette; count: number }) {
  const geo = useMemo(() => makeStarfieldGeometry(count, 24), [count]);
  const dpr = useThree((s) => s.viewport.dpr);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: STARS_VERT,
        fragmentShader: STARS_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: dpr },
          uTint: { value: new THREE.Color(palette.atmos) },
        },
      }),
    [palette, dpr]
  );

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <primitive object={mat} attach="material" />
    </points>
  );
}

function Dust({ state, palette, count }: { state: SolarState; palette: Palette; count: number }) {
  const geo = useMemo(() => makeDustGeometry(count), [count]);
  const dpr = useThree((s) => s.viewport.dpr);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DUST_VERT,
        fragmentShader: DUST_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: dpr },
          uReveal: { value: 0 },
          uColor: { value: new THREE.Color(palette.corona) },
        },
      }),
    [palette, dpr]
  );

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
    // Hover brings the dust field up out of the background.
    mat.uniforms.uReveal.value = state.glow;
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <primitive object={mat} attach="material" />
    </points>
  );
}

export function Particles({
  state,
  palette,
  starCount = 420,
  dustCount = 180,
}: {
  state: SolarState;
  palette: Palette;
  starCount?: number;
  dustCount?: number;
}) {
  return (
    <>
      <Starfield palette={palette} count={starCount} />
      <Dust state={state} palette={palette} count={dustCount} />
    </>
  );
}
