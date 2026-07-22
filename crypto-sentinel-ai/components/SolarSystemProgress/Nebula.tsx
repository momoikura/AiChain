"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NEBULA_VERT, NEBULA_FRAG } from "./shaders/space";
import { type Palette } from "./constants";

/**
 * Volumetric nebula shell.
 *
 * Rendered on the inside of a large sphere so it surrounds the system at every
 * camera angle without a skybox texture. Kept at very low contrast on purpose:
 * a loud nebula turns the component into a poster. This one should read as
 * atmosphere you notice only once you look for it.
 */
export function Nebula({ palette, intensity = 1 }: { palette: Palette; intensity?: number }) {
  const geo = useMemo(() => new THREE.SphereGeometry(28, 32, 24), []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NEBULA_VERT,
        fragmentShader: NEBULA_FRAG,
        transparent: true,
        depthWrite: false,
        // Inside-out: we are looking at the shell from within.
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uColorA: { value: new THREE.Color("#0a1830") },
          uColorB: { value: new THREE.Color(palette.ocean) },
          uIntensity: { value: intensity },
        },
      }),
    [palette, intensity]
  );

  useFrame((_, dt) => {
    // Very slow drift — a full structural change takes minutes.
    mat.uniforms.uTime.value += dt;
  });

  return (
    <mesh geometry={geo} frustumCulled={false}>
      <primitive object={mat} attach="material" />
    </mesh>
  );
}
