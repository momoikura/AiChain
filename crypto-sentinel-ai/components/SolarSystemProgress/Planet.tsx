"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PLANET_VERT, PLANET_FRAG, CLOUD_VERT, CLOUD_FRAG } from "./shaders/planet";
import { PLANET_RADIUS, type Palette } from "./constants";
import type { SolarState } from "./state";

/**
 * The central planet: a PBR surface shell plus a thin animated cloud shell.
 * Rotation is deliberately near the threshold of perception — roughly one turn
 * every five minutes — so the planet reads as alive without ever drawing focus
 * away from the percentage sitting on top of it.
 */
export function Planet({ state, palette }: { state: SolarState; palette: Palette }) {
  const surfaceRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  // Bridge the framework-agnostic SolarState vector into a THREE uniform.
  // SolarState deliberately avoids importing three (see state.ts).
  const lightUniform = useMemo(() => new THREE.Vector3(), []);

  const surfaceMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: PLANET_VERT,
        fragmentShader: PLANET_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uLandColor: { value: new THREE.Color(palette.land) },
          uOceanColor: { value: new THREE.Color(palette.ocean) },
          uAtmosColor: { value: new THREE.Color(palette.atmos) },
          uLightDir: { value: lightUniform },
          uLightIntensity: { value: 2.5 },
          uGlow: { value: 0 },
          uPulse: { value: 0 },
        },
      }),
    [palette, lightUniform]
  );

  const cloudMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: CLOUD_VERT,
        fragmentShader: CLOUD_FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uLightDir: { value: lightUniform },
          uTint: { value: new THREE.Color(palette.atmos) },
          uOpacity: { value: 0.42 },
        },
      }),
    [palette, lightUniform]
  );

  // Geometry is shared between both shells; 64 segments is the point past which
  // extra subdivision is invisible at this on-screen size.
  const geo = useMemo(() => new THREE.SphereGeometry(PLANET_RADIUS, 64, 48), []);
  const cloudGeo = useMemo(() => new THREE.SphereGeometry(PLANET_RADIUS * 1.016, 48, 36), []);

  useFrame((_, dt) => {
    lightUniform.set(state.lightDir.x, state.lightDir.y, state.lightDir.z);

    const t = surfaceMat.uniforms.uTime.value + dt;
    surfaceMat.uniforms.uTime.value = t;
    cloudMat.uniforms.uTime.value = t;
    surfaceMat.uniforms.uGlow.value = state.glow;
    surfaceMat.uniforms.uPulse.value = state.pulse;
    // Clouds thicken very slightly on hover — reads as the atmosphere catching light.
    cloudMat.uniforms.uOpacity.value = 0.42 + state.glow * 0.12;

    if (surfaceRef.current) surfaceRef.current.rotation.y += dt * 0.021;
    // Clouds drift faster than the surface: real weather is not tidally locked.
    if (cloudRef.current) cloudRef.current.rotation.y += dt * 0.032;
  });

  return (
    <group>
      <mesh ref={surfaceRef} geometry={geo}>
        <primitive object={surfaceMat} attach="material" />
      </mesh>
      <mesh ref={cloudRef} geometry={cloudGeo}>
        <primitive object={cloudMat} attach="material" />
      </mesh>
    </group>
  );
}
