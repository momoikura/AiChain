"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { STAR_CORE_VERT, STAR_CORE_FRAG, CORONA_VERT, CORONA_FRAG } from "./shaders/star";
import { orbitPoint, type Palette } from "./constants";
import type { SolarState } from "./state";

/**
 * The travelling star — the progress indicator itself.
 *
 * Its angular position on the orbit *is* the value: 0% sits at 12 o'clock and it
 * advances clockwise, so a glance at where the star sits reads as a percentage
 * exactly the way the original arc did.
 */
export function Star({ state, palette }: { state: SolarState; palette: Palette }) {
  const groupRef = useRef<THREE.Group>(null);

  const coreMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: STAR_CORE_VERT,
        fragmentShader: STAR_CORE_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uCore: { value: new THREE.Color("#ffffff") },
          uEdge: { value: new THREE.Color(palette.key) },
          uIntensity: { value: 1.6 },
          uFlicker: { value: 1 },
        },
      }),
    [palette]
  );

  const coronaMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: CORONA_VERT,
        fragmentShader: CORONA_FRAG,
        transparent: true,
        depthWrite: false,
        // Additive so the corona reads as emitted light rather than a painted disc.
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(palette.corona) },
          uIntensity: { value: 0.85 },
        },
      }),
    [palette]
  );

  const coreGeo = useMemo(() => new THREE.SphereGeometry(0.13, 32, 24), []);
  const coronaGeo = useMemo(() => new THREE.PlaneGeometry(1.25, 1.25), []);

  useFrame((_, dt) => {
    const t = coreMat.uniforms.uTime.value + dt;
    coreMat.uniforms.uTime.value = t;
    coronaMat.uniforms.uTime.value = t;

    coreMat.uniforms.uIntensity.value = 1.6 + state.glow * 0.5 + state.pulse * 0.8;
    coronaMat.uniforms.uIntensity.value = 0.85 + state.glow * 0.35 + state.pulse * 0.7;

    // Follow eased progress — the star flies to a new value, never teleports.
    const p = orbitPoint(state.progress);
    state.starPos.x = p.x;
    state.starPos.y = p.y;
    state.starPos.z = 0;
    if (groupRef.current) groupRef.current.position.set(p.x, p.y, 0);
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={coreGeo}>
        <primitive object={coreMat} attach="material" />
      </mesh>
      <mesh geometry={coronaGeo}>
        <primitive object={coronaMat} attach="material" />
      </mesh>
    </group>
  );
}
