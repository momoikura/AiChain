"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { damp, type SolarState } from "./state";

/**
 * Cinematic camera rig.
 *
 * Two layers of motion: an ambient drift on two incommensurate sine pairs (so
 * the path never visibly repeats), and a hover parallax that leans the camera
 * toward the pointer. Both are heavily damped and tiny in amplitude — the intent
 * is that you feel the scene is three-dimensional without ever catching the
 * camera moving.
 */
export function CameraRig({
  state,
  pointer,
}: {
  state: SolarState;
  /** Normalised pointer offset from component centre, -1..1. */
  pointer: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const camera = useThree((s) => s.camera);
  const time = useRef(0);
  const current = useRef({ x: 0, y: 0 });
  const lookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, dt) => {
    // Clamp dt: a backgrounded tab can deliver a multi-second delta on resume,
    // which would otherwise snap the camera across the scene in one frame.
    const d = Math.min(dt, 0.05);
    time.current += d;
    const t = time.current;

    const driftX = Math.sin(t * 0.11) * 0.16 + Math.sin(t * 0.037) * 0.07;
    const driftY = Math.cos(t * 0.083) * 0.11 + Math.cos(t * 0.029) * 0.05;

    const targetX = driftX + pointer.current.x * 0.42 * (0.4 + state.glow * 0.6);
    const targetY = driftY + pointer.current.y * 0.3 * (0.4 + state.glow * 0.6);

    current.current.x = damp(current.current.x, targetX, 2.4, d);
    current.current.y = damp(current.current.y, targetY, 2.4, d);

    camera.position.x = current.current.x;
    camera.position.y = current.current.y;
    // Pull in very slightly on hover.
    camera.position.z = damp(camera.position.z, 5.35 - state.glow * 0.22, 2.4, d);
    camera.lookAt(lookAt.current);
  });

  return null;
}
