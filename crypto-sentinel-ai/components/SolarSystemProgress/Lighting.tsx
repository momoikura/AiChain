"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SolarState } from "./state";
import { ORBIT_TILT } from "./constants";

/**
 * Lighting rig.
 *
 * The planet is lit by a blend of a fixed key light and the orbiting star, so
 * the terminator visibly sweeps as progress advances — the light source *is*
 * the progress indicator. The blend is capped at 45% star influence: a pure
 * star light would leave the planet's face unlit at low progress and drop the
 * contrast behind the percentage below WCAG AA.
 */

/** Fixed key direction — upper left, slightly toward camera. */
const KEY_DIR = new THREE.Vector3(-0.6, 0.35, 0.72).normalize();
const STAR_INFLUENCE = 0.45;

export function Lighting({ state }: { state: SolarState }) {
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const tilt = useMemo(() => new THREE.Matrix4().makeRotationX(-ORBIT_TILT), []);

  useFrame(() => {
    // Star position is authored in the orbit's local (untilted) plane; bring it
    // into world space before deriving a light direction from it.
    scratch.set(state.starPos.x, state.starPos.y, state.starPos.z).applyMatrix4(tilt).normalize();
    scratch
      .multiplyScalar(STAR_INFLUENCE)
      .addScaledVector(KEY_DIR, 1 - STAR_INFLUENCE)
      .normalize();
    state.lightDir.x = scratch.x;
    state.lightDir.y = scratch.y;
    state.lightDir.z = scratch.z;
  });

  return (
    <>
      {/* Ambient fill — deep-space bounce is near zero, so this stays very low. */}
      <ambientLight intensity={0.12} color="#4a6a8a" />
      {/* Key light, matching the shader's fixed component. */}
      <directionalLight position={[-3, 1.8, 3.6]} intensity={0.9} color="#dfe9ff" />
      {/* Cool rim from behind separates the planet from the nebula. */}
      <directionalLight position={[2.4, -1.2, -3]} intensity={0.35} color="#2f6f8f" />
    </>
  );
}
